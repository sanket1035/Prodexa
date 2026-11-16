import os

import pytest
from sqlalchemy import create_engine, text

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://prodexa:prodexa@localhost:5432/prodexa_test"
)


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL)
    try:
        with eng.connect() as c:
            c.execute(text("select 1"))
    except Exception:
        pytest.skip("PostgreSQL not reachable; integration tests skipped")
    return eng
