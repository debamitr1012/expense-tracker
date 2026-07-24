import calendar
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
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
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    expenses = db.scalars(
        select(Expense).where(Expense.user_id == user_id)
    ).all()

    today = date.today()
    if month:
        try:
            year_str, month_str = month.split("-")
            target_year, target_month = int(year_str), int(month_str)
        except ValueError:
            target_year, target_month = today.year, today.month
    else:
        target_year, target_month = today.year, today.month

    target_month_expenses = [
        e for e in expenses if e.date.year == target_year and e.date.month == target_month
    ]
    month_total = sum((float(e.amount) for e in target_month_expenses), start=0.0)

    by_category_map: dict[str, float] = {}
    for e in target_month_expenses:
        by_category_map[e.category] = by_category_map.get(e.category, 0.0) + float(e.amount)
    by_category = [
        {"category": cat, "total": tot}
        for cat, tot in sorted(by_category_map.items(), key=lambda kv: kv[1], reverse=True)
    ]

    _, num_days = calendar.monthrange(target_year, target_month)
    if target_year == today.year and target_month == today.month:
        days_passed = max(today.day, 1)
    else:
        days_passed = num_days

    avg_per_day = month_total / days_passed if days_passed > 0 else 0.0

    daily_trend = []
    for day_num in range(1, num_days + 1):
        d = date(target_year, target_month, day_num)
        day_total = sum((float(e.amount) for e in target_month_expenses if e.date == d), start=0.0)
        daily_trend.append({"date": d.isoformat(), "total": day_total})

    if target_month == 1:
        prev_year, prev_month = target_year - 1, 12
    else:
        prev_year, prev_month = target_year, target_month - 1

    prev_month_expenses = [
        e for e in expenses if e.date.year == prev_year and e.date.month == prev_month
    ]
    prev_month_total = sum((float(e.amount) for e in prev_month_expenses), start=0.0)
    total_all_time = sum((float(e.amount) for e in expenses), start=0.0)

    return {
        "selectedMonth": f"{target_year:04d}-{target_month:02d}",
        "total": total_all_time,
        "monthTotal": month_total,
        "prevMonthTotal": prev_month_total,
        "count": len(target_month_expenses),
        "totalCount": len(expenses),
        "avgPerDay": float(avg_per_day),
        "byCategory": by_category,
        "dailyTrend": daily_trend,
    }
