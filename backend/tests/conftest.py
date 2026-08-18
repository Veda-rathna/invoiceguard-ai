import pytest
from app.db.init_db import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes the database schema and seeds default rules before running tests."""
    init_db()
