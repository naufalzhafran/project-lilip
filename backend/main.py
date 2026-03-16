from datetime import time as dtime, timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
import models

app = FastAPI(title="Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Employees ─────────────────────────────────────────────────────────────────


@app.get("/employees", response_model=List[models.EmployeeResponse])
def list_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).order_by(models.Employee.created_at.desc()).all()


@app.get("/employees/{employee_id}", response_model=models.EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@app.post("/employees", response_model=models.EmployeeResponse, status_code=201)
def create_employee(payload: models.EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(models.Employee).filter(models.Employee.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    emp = models.Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@app.put("/employees/{employee_id}", response_model=models.EmployeeResponse)
def update_employee(
    employee_id: int, payload: models.EmployeeUpdate, db: Session = Depends(get_db)
):
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if payload.email and payload.email != emp.email:
        if (
            db.query(models.Employee)
            .filter(models.Employee.email == payload.email)
            .first()
        ):
            raise HTTPException(status_code=409, detail="Email already registered")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return emp


@app.delete("/employees/{employee_id}", status_code=204)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

_PAGI_START = dtime(8, 30)
_PAGI_END = dtime(12, 0)
_SIANG_START = dtime(12, 1)
_SIANG_END = dtime(17, 30)


def _is_ontime(interview_dt, report_dt) -> bool:
    """Return True when the report was sent on time relative to the interview."""
    if interview_dt is None or report_dt is None:
        return False

    # Strip timezone so we compare wall-clock values (as entered by the user)
    if getattr(interview_dt, "tzinfo", None) is not None:
        interview_dt = interview_dt.replace(tzinfo=None)
    if getattr(report_dt, "tzinfo", None) is not None:
        report_dt = report_dt.replace(tzinfo=None)

    i_date, i_time = interview_dt.date(), interview_dt.time()
    r_date, r_time = report_dt.date(), report_dt.time()

    def _pagi(t):
        return _PAGI_START <= t <= _PAGI_END

    def _siang(t):
        return _SIANG_START <= t <= _SIANG_END

    if i_date == r_date:
        # Pagi→Pagi, Siang→Siang, or Pagi→Siang (same day, cross-block)
        return (
            (_pagi(i_time) and _pagi(r_time))
            or (_siang(i_time) and _siang(r_time))
            or (_pagi(i_time) and _siang(r_time))
        )

    if (r_date - i_date) == timedelta(days=1):
        # Siang→Pagi: interview siang, report pagi next day
        return _siang(i_time) and _pagi(r_time)

    return False


# ── Recruitment Data ──────────────────────────────────────────────────────────


@app.get(
    "/employees/{employee_id}/recruitments",
    response_model=List[models.RecruitmentResponse],
)
def list_recruitments(employee_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Employee).filter(models.Employee.id == employee_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")
    return (
        db.query(models.RecruitmentData)
        .filter(models.RecruitmentData.employee_id == employee_id)
        .order_by(models.RecruitmentData.created_at.desc())
        .all()
    )


@app.post(
    "/employees/{employee_id}/recruitments",
    response_model=models.RecruitmentResponse,
    status_code=201,
)
def create_recruitment(
    employee_id: int, payload: models.RecruitmentCreate, db: Session = Depends(get_db)
):
    if not db.query(models.Employee).filter(models.Employee.id == employee_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")
    data = payload.model_dump()
    rec = models.RecruitmentData(
        employee_id=employee_id,
        **data,
        is_ontime=_is_ontime(
            data.get("interview_datetime"), data.get("report_sent_datetime")
        ),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@app.get("/recruitments/{recruitment_id}", response_model=models.RecruitmentResponse)
def get_recruitment(recruitment_id: int, db: Session = Depends(get_db)):
    rec = (
        db.query(models.RecruitmentData)
        .filter(models.RecruitmentData.id == recruitment_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recruitment record not found")
    return rec


@app.put("/recruitments/{recruitment_id}", response_model=models.RecruitmentResponse)
def update_recruitment(
    recruitment_id: int,
    payload: models.RecruitmentUpdate,
    db: Session = Depends(get_db),
):
    rec = (
        db.query(models.RecruitmentData)
        .filter(models.RecruitmentData.id == recruitment_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recruitment record not found")
    updates = payload.model_dump(exclude_none=True)
    for k, v in updates.items():
        setattr(rec, k, v)
    rec.is_ontime = _is_ontime(rec.interview_datetime, rec.report_sent_datetime)
    db.commit()
    db.refresh(rec)
    return rec


@app.get("/recruitments", response_model=List[models.RecruitmentWithEmployeeResponse])
def list_all_recruitments(db: Session = Depends(get_db)):
    results = (
        db.query(
            models.RecruitmentData.id,
            models.RecruitmentData.employee_id,
            models.Employee.name.label("employee_name"),
            models.RecruitmentData.candidate_name,
            models.RecruitmentData.candidate_role,
            models.RecruitmentData.interview_datetime,
            models.RecruitmentData.report_sent_datetime,
            models.RecruitmentData.is_ontime,
            models.RecruitmentData.created_at,
        )
        .join(models.Employee, models.RecruitmentData.employee_id == models.Employee.id)
        .order_by(models.RecruitmentData.created_at.desc())
        .all()
    )
    return [
        models.RecruitmentWithEmployeeResponse(
            id=r.id,
            employee_id=r.employee_id,
            employee_name=r.employee_name,
            candidate_name=r.candidate_name,
            candidate_role=r.candidate_role,
            interview_datetime=r.interview_datetime,
            report_sent_datetime=r.report_sent_datetime,
            is_ontime=r.is_ontime,
            created_at=r.created_at,
        )
        for r in results
    ]


@app.delete("/recruitments/{recruitment_id}", status_code=204)
def delete_recruitment(recruitment_id: int, db: Session = Depends(get_db)):
    rec = (
        db.query(models.RecruitmentData)
        .filter(models.RecruitmentData.id == recruitment_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recruitment record not found")
    db.delete(rec)
    db.commit()
