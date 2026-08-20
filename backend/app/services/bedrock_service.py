import os
import json
import time
import logging
import base64
from typing import Dict, Any, Optional, Tuple
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, BotoCoreError

from app.core.config import settings

logger = logging.getLogger("bedrock_service")
logging.basicConfig(level=logging.INFO)


class BedrockService:
    """
    Dedicated AWS Bedrock Runtime Client for Qwen3-VL (qwen.qwen3-vl-235b-a22b).
    Supports both Converse API and InvokeModel with multimodal image understanding,
    exponential backoff retries, telemetry tracking, and robust error normalization.
    """

    def __init__(self):
        self.model_id = settings.BEDROCK_MODEL_ID
        self.region = settings.AWS_REGION
        self.client = None
        self.auth_mode = "None"
        self._init_client()

    def _init_client(self):
        try:
            self.model_id = settings.BEDROCK_MODEL_ID
            self.region = settings.AWS_REGION

            boto_config = Config(
                region_name=self.region,
                retries={"max_attempts": 3, "mode": "standard"},
                connect_timeout=15,
                read_timeout=90,
            )
            
            kwargs = {
                "service_name": "bedrock-runtime",
                "region_name": self.region,
                "config": boto_config
            }

            # Check explicit AWS credentials
            access_key = settings.AWS_ACCESS_KEY_ID or os.getenv("AWS_ACCESS_KEY_ID")
            secret_key = settings.AWS_SECRET_ACCESS_KEY or os.getenv("AWS_SECRET_ACCESS_KEY")
            session_token = settings.AWS_SESSION_TOKEN or os.getenv("AWS_SESSION_TOKEN")

            if access_key and secret_key:
                kwargs["aws_access_key_id"] = access_key.strip().strip('"').strip("'")
                kwargs["aws_secret_access_key"] = secret_key.strip().strip('"').strip("'")
                if session_token:
                    kwargs["aws_session_token"] = session_token.strip().strip('"').strip("'")
                self.auth_mode = "AWS IAM Access Keys"
            else:
                self.auth_mode = "Default AWS Credential Chain / Environment"

            self.client = boto3.client(**kwargs)
            logger.info(f"Bedrock Runtime client initialized ({self.auth_mode}) for model {self.model_id} in {self.region}")
        except Exception as e:
            logger.warning(f"Could not initialize Bedrock client: {e}. Will rely on fallback/DEMO_MODE.")
            self.client = None
            self.auth_mode = f"Error: {e}"

    def reconnect(self) -> Dict[str, Any]:
        """
        Reinitializes the Bedrock boto3 client and executes an active connectivity test.
        """
        self._init_client()
        return self.check_connection()

    def check_connection(self) -> Dict[str, Any]:
        """
        Tests live connectivity to Amazon Bedrock Runtime.
        """
        if not self.client:
            self._init_client()

        if not self.client:
            return {
                "connected": False,
                "status": "error",
                "provider": "Amazon Bedrock",
                "model_id": self.model_id,
                "region": self.region,
                "auth_mode": self.auth_mode,
                "error": "Bedrock client not initialized. Please verify AWS credentials in .env"
            }

        try:
            # Send a fast test prompt
            output, latency_ms, tokens, error = self.invoke_text(
                system_prompt="You are an automated connectivity verification assistant for Amazon Bedrock.",
                user_prompt="Ping check. Respond with 'CONNECTED_OK'",
                max_tokens=15
            )
            if error:
                return {
                    "connected": False,
                    "status": "error",
                    "provider": "Amazon Bedrock",
                    "model_id": self.model_id,
                    "region": self.region,
                    "auth_mode": self.auth_mode,
                    "error": error
                }
            return {
                "connected": True,
                "status": "active",
                "provider": "Amazon Bedrock",
                "model_id": self.model_id,
                "region": self.region,
                "auth_mode": self.auth_mode,
                "latency_ms": round(latency_ms, 1),
                "response": output.strip()
            }
        except Exception as e:
            return {
                "connected": False,
                "status": "error",
                "provider": "Amazon Bedrock",
                "model_id": self.model_id,
                "region": self.region,
                "auth_mode": self.auth_mode,
                "error": str(e)
            }

    def invoke_multimodal(
        self,
        image_bytes: bytes,
        image_mime_type: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 4096
    ) -> Tuple[Optional[str], float, int, Optional[str]]:
        """
        Sends multimodal visual image request to Bedrock Runtime for Qwen3-VL.
        Tries Converse API first, falls back to InvokeModel.
        Returns: (response_text, latency_ms, tokens_used, error_message)
        """
        if not self.client:
            return None, 0.0, 0, "Bedrock client not initialized"

        start_time = time.time()
        max_retries = 3
        backoff_delay = 1.0

        # Determine image format for Bedrock Converse API (jpeg, png, webp, gif)
        img_format = "jpeg"
        if "png" in image_mime_type.lower():
            img_format = "png"
        elif "webp" in image_mime_type.lower():
            img_format = "webp"

        for attempt in range(1, max_retries + 1):
            try:
                # 1. Attempt using Bedrock Converse API
                logger.info(f"Invoking Bedrock Converse API for {self.model_id} (Attempt {attempt}/{max_retries})...")
                converse_messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": {
                                    "format": img_format,
                                    "source": {"bytes": image_bytes}
                                }
                            },
                            {
                                "text": user_prompt
                            }
                        ]
                    }
                ]
                
                try:
                    response = self.client.converse(
                        modelId=self.model_id,
                        messages=converse_messages,
                        system=[{"text": system_prompt}],
                        inferenceConfig={
                            "temperature": temperature,
                            "maxTokens": max_tokens
                        }
                    )
                    latency_ms = (time.time() - start_time) * 1000.0
                    output_msg = response.get("output", {}).get("message", {})
                    content_blocks = output_msg.get("content", [])
                    text_parts = [b.get("text", "") for b in content_blocks if "text" in b]
                    output_text = "\n".join(text_parts)
                    tokens_used = response.get("usage", {}).get("totalTokens", 0)
                    
                    logger.info(f"Bedrock Converse API succeeded in {latency_ms:.2f}ms with {tokens_used} tokens")
                    return output_text, latency_ms, tokens_used, None

                except (ClientError, Exception) as converse_err:
                    logger.info(f"Converse API call threw: {converse_err}. Trying direct invoke_model payload...")

                # 2. Direct invoke_model payload fallback
                encoded_image = base64.b64encode(image_bytes).decode("utf-8")
                payload = {
                    "messages": [
                        {
                            "role": "system",
                            "content": [{"type": "text", "text": system_prompt}]
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": image_mime_type,
                                        "data": encoded_image
                                    }
                                },
                                {
                                    "type": "text",
                                    "text": user_prompt
                                }
                            ]
                        }
                    ],
                    "parameters": {
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                }

                response = self.client.invoke_model(
                    modelId=self.model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(payload)
                )

                latency_ms = (time.time() - start_time) * 1000.0
                response_body = json.loads(response["body"].read().decode("utf-8"))

                output_text = ""
                tokens_used = 0

                if "output" in response_body and "choices" in response_body["output"]:
                    output_text = response_body["output"]["choices"][0]["message"]["content"]
                elif "choices" in response_body and len(response_body["choices"]) > 0:
                    choice = response_body["choices"][0]
                    if "message" in choice and "content" in choice["message"]:
                        output_text = choice["message"]["content"]
                    elif "text" in choice:
                        output_text = choice["text"]
                elif "generation" in response_body:
                    output_text = response_body["generation"]
                else:
                    output_text = json.dumps(response_body)

                if "usage" in response_body:
                    tokens_used = response_body["usage"].get("total_tokens", 0)

                logger.info(f"Bedrock invoke_model succeeded in {latency_ms:.2f}ms")
                return output_text, latency_ms, tokens_used, None

            except ClientError as ce:
                error_code = ce.response.get("Error", {}).get("Code", "Unknown")
                error_msg = ce.response.get("Error", {}).get("Message", str(ce))
                logger.warning(f"Bedrock ClientError ({error_code}): {error_msg}")

                if error_code in ["ThrottlingException", "RequestTimeout", "ServiceUnavailable"] and attempt < max_retries:
                    time.sleep(backoff_delay)
                    backoff_delay *= 2
                    continue
                else:
                    latency_ms = (time.time() - start_time) * 1000.0
                    return None, latency_ms, 0, f"Bedrock error ({error_code}): {error_msg}"

            except Exception as e:
                logger.error(f"Bedrock invocation exception: {e}")
                if attempt < max_retries:
                    time.sleep(backoff_delay)
                    backoff_delay *= 2
                    continue
                latency_ms = (time.time() - start_time) * 1000.0
                return None, latency_ms, 0, str(e)

        return None, (time.time() - start_time) * 1000.0, 0, "Max retries exceeded"

    def invoke_text(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 2048
    ) -> Tuple[Optional[str], float, int, Optional[str]]:
        """
        Sends text reasoning request to Bedrock Runtime (for semantic comparison or explanation).
        """
        if not self.client:
            return None, 0.0, 0, "Bedrock client not initialized"

        start_time = time.time()
        
        # Try converse first
        try:
            response = self.client.converse(
                modelId=self.model_id,
                messages=[{"role": "user", "content": [{"text": user_prompt}]}],
                system=[{"text": system_prompt}],
                inferenceConfig={
                    "temperature": temperature,
                    "maxTokens": max_tokens
                }
            )
            latency_ms = (time.time() - start_time) * 1000.0
            output_msg = response.get("output", {}).get("message", {})
            content_blocks = output_msg.get("content", [])
            text_parts = [b.get("text", "") for b in content_blocks if "text" in b]
            output_text = "\n".join(text_parts)
            tokens_used = response.get("usage", {}).get("totalTokens", 0)
            return output_text, latency_ms, tokens_used, None
        except Exception:
            pass

        # Fallback to invoke_model
        payload = {
            "messages": [
                {"role": "system", "content": [{"type": "text", "text": system_prompt}]},
                {"role": "user", "content": [{"type": "text", "text": user_prompt}]}
            ],
            "parameters": {
                "temperature": temperature,
                "max_tokens": max_tokens
            }
        }

        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload)
            )
            latency_ms = (time.time() - start_time) * 1000.0
            response_body = json.loads(response["body"].read().decode("utf-8"))

            output_text = ""
            tokens_used = 0
            if "choices" in response_body and len(response_body["choices"]) > 0:
                output_text = response_body["choices"][0]["message"].get("content", "")
            elif "output" in response_body:
                output_text = str(response_body["output"])
            else:
                output_text = json.dumps(response_body)

            if "usage" in response_body:
                tokens_used = response_body["usage"].get("total_tokens", 0)

            return output_text, latency_ms, tokens_used, None
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000.0
            logger.warning(f"Bedrock invoke_text failed: {e}")
            return None, latency_ms, 0, str(e)


bedrock_service = BedrockService()
