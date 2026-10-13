from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, Relationship

class Conversation(SQLModel, table=True):

    __tablename__="conversations"

    id: int | None = Field(default=None, primary_key=True)
    session_id: str = Field(index=True, unique=True)
    created_At: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    messages: list["Message"] =Relationship(
        back_populates="conversation"
    )


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(
        foreign_key="conversations.id"
    )
    role: str
    content: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    conversation: Conversation | None = Relationship(
        back_populates="messages"
    )
