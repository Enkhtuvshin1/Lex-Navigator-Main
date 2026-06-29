"""add cases, messages, law tables and lawyer fields to users

Revision ID: b2c4f1e83a90
Revises: 00037226464b
Create Date: 2026-03-30 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b2c4f1e83a90"
down_revision: Union[str, Sequence[str], None] = "00037226464b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Drop legacy tables from old schema (messages references chats) ---
    op.execute("DROP TABLE IF EXISTS messages CASCADE")
    op.execute("DROP TABLE IF EXISTS chats CASCADE")

    # --- Lawyer fields on users ---
    op.add_column("users", sa.Column("role", sa.String(20), server_default="user", nullable=False))
    op.add_column("users", sa.Column("bar_number", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("specialization", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("law_firm", sa.String(255), nullable=True))

    # --- Cases table ---
    op.create_table(
        "cases",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), server_default="open", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cases_user_id", "cases", ["user_id"])

    # --- Messages table ---
    op.create_table(
        "messages",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("law_references", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_case_id", "messages", ["case_id"])

    # --- Law categories table ---
    op.create_table(
        "law_categories",
        sa.Column("id", sa.Integer, autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- Law articles table ---
    op.create_table(
        "law_articles",
        sa.Column("id", sa.Integer, autoincrement=True, nullable=False),
        sa.Column("category_id", sa.Integer, nullable=False),
        sa.Column("number", sa.String(50), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["law_categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_law_articles_category_id", "law_articles", ["category_id"])


def downgrade() -> None:
    op.drop_index("ix_law_articles_category_id", table_name="law_articles")
    op.drop_table("law_articles")
    op.drop_table("law_categories")
    op.drop_index("ix_messages_case_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_cases_user_id", table_name="cases")
    op.drop_table("cases")
    op.drop_column("users", "law_firm")
    op.drop_column("users", "specialization")
    op.drop_column("users", "bar_number")
    op.drop_column("users", "role")
