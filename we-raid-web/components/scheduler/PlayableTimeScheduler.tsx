"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  DatesSetArg,
} from "@fullcalendar/core";
import koLocale from "@fullcalendar/core/locales/ko";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { format, endOfDay, addDays, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { api } from "@/lib/api";
import type { ApiResponse, PlayableTime, Schedule } from "@/lib/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── 상수 ────────────────────────────────────────────────────────────────────

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  DRAFT: { bg: "#94a3b8", border: "#64748b" },
  OPEN: { bg: "#22c55e", border: "#16a34a" },
  FULL: { bg: "#f97316", border: "#ea580c" },
  CLOSED: { bg: "#64748b", border: "#475569" },
  CANCELLED: { bg: "#ef4444", border: "#dc2626" },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "초안",
  OPEN: "모집 중",
  FULL: "정원 마감",
  CLOSED: "마감",
  CANCELLED: "취소됨",
};

// ── 타입 ────────────────────────────────────────────────────────────────────

type CreateDialogState = {
  open: boolean;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type DetailDialog =
  | { open: false }
  | {
      open: true;
      type: "pt";
      ptId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  | {
      open: true;
      type: "schedule";
      title: string;
      leaderTitle: string;
      startAt: string;
      endAt: string;
      status: string;
    };

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

export function PlayableTimeScheduler() {
  const queryClient = useQueryClient();

  const now = new Date();
  const [dateRange, setDateRange] = useState({
    from: startOfDay(now).toISOString(),
    to: endOfDay(addDays(now, 13)).toISOString(),
  });

  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    open: false,
    dayOfWeek: 0,
    startTime: "00:00",
    endTime: "01:00",
  });

  const [detailDialog, setDetailDialog] = useState<DetailDialog>({
    open: false,
  });

  // ── 쿼리 ─────────────────────────────────────────────────────────────────

  const { data: playableTimes = [] } = useQuery({
    queryKey: ["playable-times"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<PlayableTime[]>>("/playable-times");
      return res.data.data;
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules", "calendar", dateRange.from],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Schedule[]>>("/schedules", {
        params: { from: dateRange.from, to: dateRange.to },
      });
      return res.data.data;
    },
  });

  // ── 뮤테이션 ─────────────────────────────────────────────────────────────

  const createPtMutation = useMutation({
    mutationFn: async (data: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => {
      await api.post("/playable-times", { items: [data] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playable-times"] });
      setCreateDialog((prev) => ({ ...prev, open: false }));
    },
  });

  const deletePtMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/playable-times/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playable-times"] });
      setDetailDialog({ open: false });
    },
  });

  // ── FullCalendar 이벤트 변환 ──────────────────────────────────────────────

  const ptEvents = playableTimes.map((pt) => ({
    id: `pt-${pt.id}`,
    daysOfWeek: [pt.dayOfWeek],
    startTime: pt.startTime,
    endTime: pt.endTime,
    title: "가능",
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: "rgb(34, 197, 94)",
    textColor: "#15803d",
    classNames: ["fc-pt-event"],
    extendedProps: {
      type: "pt",
      ptId: pt.id,
      dayOfWeek: pt.dayOfWeek,
      startTime: pt.startTime,
      endTime: pt.endTime,
    },
  }));

  const scheduleEvents = schedules.map((s) => {
    const colors = STATUS_COLORS[s.status] ?? STATUS_COLORS.CLOSED;
    return {
      id: s.id,
      title: s.title,
      start: s.startAt,
      end: s.endAt,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: "#fff",
      classNames: ["fc-schedule-event"],
      extendedProps: {
        type: "schedule",
        status: s.status,
        leaderTitle: s.leaderTitle,
        startAt: s.startAt,
        endAt: s.endAt,
      },
    };
  });

  // ── 핸들러 ───────────────────────────────────────────────────────────────

  const handleSelect = useCallback((info: DateSelectArg) => {
    // 다일(multi-day) 선택 차단 — PT는 단일 요일 단위
    const startDay = info.start.toDateString();
    const endIsNextDay =
      info.end.toDateString() !== startDay &&
      !(info.end.getHours() === 0 && info.end.getMinutes() === 0);

    const startTime = format(info.start, "HH:mm");
    const endTime = endIsNextDay ? "23:45" : format(info.end, "HH:mm");

    setCreateDialog({
      open: true,
      dayOfWeek: info.start.getDay(),
      startTime,
      endTime,
    });
  }, []);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const props = info.event.extendedProps as Record<string, unknown>;
    if (props.type === "pt") {
      setDetailDialog({
        open: true,
        type: "pt",
        ptId: props.ptId as string,
        dayOfWeek: props.dayOfWeek as number,
        startTime: props.startTime as string,
        endTime: props.endTime as string,
      });
    } else if (props.type === "schedule") {
      setDetailDialog({
        open: true,
        type: "schedule",
        title: info.event.title,
        leaderTitle: props.leaderTitle as string,
        startAt: props.startAt as string,
        endAt: props.endAt as string,
        status: props.status as string,
      });
    }
  }, []);

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    setDateRange({ from: info.startStr, to: info.endStr });
  }, []);

  // ── 렌더링 ───────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>스케줄러</CardTitle>
          <p className="text-xs text-muted-foreground">
            빈 시간대를 드래그하여 플레이 가능 시간을 등록하세요
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {/* 범례 */}
          <div className="flex items-center gap-4 px-6 pb-3 pt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-block size-3 rounded-sm border border-green-500 bg-green-200" />
              플레이 가능 시간
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-block size-3 rounded-sm bg-green-500" />
              모집 중
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-block size-3 rounded-sm bg-orange-500" />
              정원 마감
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-block size-3 rounded-sm bg-slate-500" />
              마감/기타
            </span>
          </div>
          <div className="px-4">
            <FullCalendar
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={koLocale}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "오늘",
                month: "월간",
                week: "주간",
                day: "일간",
              }}
              selectable
              selectMirror
              unselectAuto
              select={handleSelect}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              events={[...ptEvents, ...scheduleEvents]}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="27:00:00"
              allDaySlot={false}
              nowIndicator
              expandRows
              slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
              eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            />
          </div>
        </CardContent>
      </Card>

      {/* PT 등록 다이얼로그 */}
      <Dialog
        open={createDialog.open}
        onOpenChange={(open) =>
          setCreateDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플레이 가능 시간 등록</DialogTitle>
            <DialogDescription>
              선택한 시간대를 매주 반복 일정으로 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">요일</span>
              <span className="font-medium">
                {DAY_NAMES[createDialog.dayOfWeek]}요일 (매주)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">시간</span>
              <span className="font-medium">
                {createDialog.startTime} ~ {createDialog.endTime}
              </span>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              취소
            </DialogClose>
            <Button
              onClick={() =>
                createPtMutation.mutate({
                  dayOfWeek: createDialog.dayOfWeek,
                  startTime: createDialog.startTime,
                  endTime: createDialog.endTime,
                })
              }
              disabled={createPtMutation.isPending}
            >
              {createPtMutation.isPending ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이벤트 상세 다이얼로그 */}
      {detailDialog.open && detailDialog.type === "pt" && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDetailDialog({ open: false })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>플레이 가능 시간</DialogTitle>
              <DialogDescription>등록된 PT 슬롯 정보입니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">요일</span>
                <span className="font-medium">
                  {DAY_NAMES[detailDialog.dayOfWeek]}요일 (매주)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">시간</span>
                <span className="font-medium">
                  {detailDialog.startTime} ~ {detailDialog.endTime}
                </span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                닫기
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() =>
                  deletePtMutation.mutate(
                    (detailDialog as { ptId: string }).ptId,
                  )
                }
                disabled={deletePtMutation.isPending}
              >
                {deletePtMutation.isPending ? "삭제 중..." : "삭제"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {detailDialog.open && detailDialog.type === "schedule" && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDetailDialog({ open: false })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{detailDialog.title}</DialogTitle>
              <DialogDescription>
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[detailDialog.status]?.bg ?? "#64748b",
                  }}
                >
                  {STATUS_LABELS[detailDialog.status] ?? detailDialog.status}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">공대장</span>
                <span className="font-medium">{detailDialog.leaderTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">시작</span>
                <span className="font-medium">
                  {format(new Date(detailDialog.startAt), "M월 d일 (E) HH:mm", {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">종료</span>
                <span className="font-medium">
                  {format(new Date(detailDialog.endAt), "M월 d일 (E) HH:mm", {
                    locale: ko,
                  })}
                </span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                닫기
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
