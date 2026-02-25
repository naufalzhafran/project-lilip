from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel

from database import Base


# ── ORM Models ────────────────────────────────────────────────────────────────


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), nullable=False, default="recruitment_support")
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recruitments = relationship(
        "RecruitmentData", back_populates="employee", cascade="all, delete-orphan"
    )


class RecruitmentData(Base):
    __tablename__ = "recruitment_data"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(
        Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    candidate_name = Column(String(255), nullable=False)
    candidate_role = Column(String(255), nullable=False)
    interview_datetime = Column(DateTime(timezone=True), nullable=True)
    report_sent_datetime = Column(DateTime(timezone=True), nullable=True)
    is_ontime = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="recruitments")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────


class EmployeeCreate(BaseModel):
    name: str
    email: str
    role: str = "recruitment_support"
    status: str = "active"


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RecruitmentCreate(BaseModel):
    candidate_name: str
    candidate_role: str
    interview_datetime: Optional[datetime] = None
    report_sent_datetime: Optional[datetime] = None


class RecruitmentUpdate(BaseModel):
    candidate_name: Optional[str] = None
    candidate_role: Optional[str] = None
    interview_datetime: Optional[datetime] = None
    report_sent_datetime: Optional[datetime] = None


class RecruitmentResponse(BaseModel):
    id: int
    employee_id: int
    candidate_name: str
    candidate_role: str
    interview_datetime: Optional[datetime] = None
    report_sent_datetime: Optional[datetime] = None
    is_ontime: Optional[bool] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RecruitmentWithEmployeeResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    candidate_name: str
    candidate_role: str
    interview_datetime: Optional[datetime] = None
    report_sent_datetime: Optional[datetime] = None
    is_ontime: Optional[bool] = None
    created_at: datetime

    model_config = {"from_attributes": True}
