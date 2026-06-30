from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Expense
from schemas import ExpenseDto, ExpenseResponseDto
from security import get_current_user_id

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseResponseDto])
def get_all(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[Expense]:
    return db.scalars(
        select(Expense)
        .where(Expense.user_id == user_id)
        .order_by(Expense.date.desc(), Expense.id.desc())
    ).all()


@router.post("", response_model=ExpenseResponseDto, status_code=status.HTTP_201_CREATED)
def create(
    dto: ExpenseDto,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Expense:
    expense = Expense(
        description=dto.description.strip(),
        amount=dto.amount,
        category=dto.category,
        date=dto.date,
        user_id=user_id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def update(
    expense_id: int,
    dto: ExpenseDto,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Response:
    expense = db.scalar(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
    )
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    expense.description = dto.description.strip()
    expense.amount = dto.amount
    expense.category = dto.category
    expense.date = dto.date
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    expense_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Response:
    expense = db.scalar(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
    )
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    expenses = db.scalars(
        select(Expense).where(Expense.user_id == user_id)
    ).all()

    today = date.today()
    month_start = today.replace(day=1)

    total = sum((e.amount for e in expenses), start=0)
    month_expenses = [e for e in expenses if e.date >= month_start]
    month_total = sum((e.amount for e in month_expenses), start=0)

    by_category_map: dict[str, float] = {}
    for e in expenses:
        by_category_map[e.category] = by_category_map.get(e.category, 0) + float(e.amount)
    by_category = [
        {"category": cat, "total": tot}
        for cat, tot in sorted(by_category_map.items(), key=lambda kv: kv[1], reverse=True)
    ]

    daily_trend = []
    for i in range(14):
        day = today - timedelta(days=13 - i)
        day_total = sum((float(e.amount) for e in expenses if e.date == day), start=0)
        daily_trend.append({"date": day.isoformat(), "total": day_total})

    return {
        "total": float(total),
        "monthTotal": float(month_total),
        "count": len(expenses),
        "avgPerDay": float(month_total) / today.day if today.day > 0 else 0,
        "byCategory": by_category,
        "dailyTrend": daily_trend,
    }
