"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfDay, addDays, format, isToday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type {
  ApiResponse,
  Group,
  GroupMemberRole,
  Schedule,
  NotificationList,
  Notification,
  ScheduleStatus,
} from "@/lib/types/api";

type MyGroup = Group & { memberCount: number; myRole: GroupMemberRole };
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayableTimeScheduler } from "@/components/scheduler/PlayableTimeScheduler";

const STATUS_MAP: Record<ScheduleStatus, { label: string; className: string }> =
  {
    DRAFT: { label: "초안", className: "bg-slate-100 text-slate-500" },
    OPEN: { label: "모집 중", className: "bg-green-100 text-green-700" },
    FULL: { label: "정원 마감", className: "bg-orange-100 text-orange-700" },
    CLOSED: { label: "마감", className: "bg-slate-100 text-slate-600" },
    CANCELLED: { label: "취소됨", className: "bg-red-100 text-red-500" },
  };

const ScheduleItem = ({ schedule }: { schedule: Schedule }) => {
  const status = STATUS_MAP[schedule.status];
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {schedule.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {format(parseISO(schedule.startAt), "M월 d일 (E) HH:mm", {
            locale: ko,
          })}
          {" · "}
          {schedule.leaderTitle}
        </p>
      </div>
      <span
        className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
      >
        {status.label}
      </span>
    </div>
  );
};

const PendingInviteItem = ({
  notification,
  onRespond,
  disabled,
}: {
  notification: Notification;
  onRespond: (
    scheduleId: string,
    status: "ACCEPTED" | "DECLINED",
    notifId: string,
  ) => void;
  disabled: boolean;
}) => {
  const payload = (() => {
    try {
      return JSON.parse(notification.payload) as { scheduleId?: string };
    } catch {
      return {};
    }
  })();
  const scheduleId = payload.scheduleId ?? "";

  return (
    <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{notification.body}</p>
      </div>
      {scheduleId && (
        <div className="ml-3 flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onRespond(scheduleId, "DECLINED", notification.id)}
          >
            거절
          </Button>
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => onRespond(scheduleId, "ACCEPTED", notification.id)}
          >
            수락
          </Button>
        </div>
      )}
    </div>
  );
};

const HomePage = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const now = new Date();
  const from = startOfDay(now).toISOString();
  const to = addDays(startOfDay(now), 7).toISOString();

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["schedules", "home", from],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Schedule[]>>("/schedules", {
        params: { from, to },
      });
      return res.data.data;
    },
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<NotificationList>>("/notifications");
      return res.data.data;
    },
  });

  const pendingInvites =
    notifData?.items?.filter((n) => n.type === "RAID_INVITE" && !n.isRead) ??
    [];

  const respondMutation = useMutation({
    mutationFn: async ({
      scheduleId,
      status,
      notifId,
    }: {
      scheduleId: string;
      status: "ACCEPTED" | "DECLINED";
      notifId: string;
    }) => {
      await api.patch(`/schedules/${scheduleId}/participants/me`, { status });
      await api.patch(`/notifications/${notifId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["schedules", "home"] });
    },
  });

  const { data: myGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups", "mine"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MyGroup[]>>("/groups");
      return res.data.data;
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (code: string) => {
      await api.post(`/groups/join/${code}`);
    },
    onSuccess: () => {
      setInviteCode("");
      setInviteMessage({ type: "success", text: "그룹에 참여했습니다!" });
      queryClient.invalidateQueries({ queryKey: ["groups", "mine"] });
    },
    onError: () => {
      setInviteMessage({
        type: "error",
        text: "유효하지 않은 초대 코드입니다.",
      });
    },
  });

  const todaySchedules =
    schedules?.filter((s) => isToday(parseISO(s.startAt))) ?? [];
  const upcomingSchedules =
    schedules?.filter((s) => !isToday(parseISO(s.startAt))) ?? [];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            안녕하세요, {user?.nickname ?? "..."}님
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {format(now, "yyyy년 M월 d일 (E)", { locale: ko })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          로그아웃
        </Button>
      </div>

      {/* 미응답 초대 */}
      {pendingInvites.length > 0 && (
        <section className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">미응답 초대</h2>
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {pendingInvites.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingInvites.map((n) => (
              <PendingInviteItem
                key={n.id}
                notification={n}
                onRespond={(scheduleId, status, notifId) => {
                  respondMutation.mutate({ scheduleId, status, notifId });
                }}
                disabled={respondMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* 플레이 타임 스케줄러 */}
      <PlayableTimeScheduler />

      {/* 오늘 레이드 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            오늘 레이드
            {todaySchedules.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {todaySchedules.length}개
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedulesLoading && (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {!schedulesLoading && todaySchedules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              오늘 예정된 레이드가 없습니다.
            </p>
          )}
          {!schedulesLoading && todaySchedules.length > 0 && (
            <div className="space-y-2">
              {todaySchedules.map((s) => (
                <ScheduleItem key={s.id} schedule={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이번 주 레이드 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            이번 주 레이드
            {upcomingSchedules.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {upcomingSchedules.length}개
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedulesLoading && (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {!schedulesLoading && upcomingSchedules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              이번 주 예정된 레이드가 없습니다.
            </p>
          )}
          {!schedulesLoading && upcomingSchedules.length > 0 && (
            <div className="space-y-2">
              {upcomingSchedules.map((s) => (
                <ScheduleItem key={s.id} schedule={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 그룹 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>내 그룹</CardTitle>
          <Button size="sm" onClick={() => router.push("/group/create")}>
            + 새 그룹
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 내 그룹 목록 */}
          {groupsLoading && (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {!groupsLoading && myGroups && myGroups.length > 0 && (
            <div className="space-y-2">
              {myGroups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => router.push(`/group/${group.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {group.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      멤버 {group.memberCount}명
                      {group.myRole === "OWNER" && " · 그룹장"}
                      {group.myRole === "SUB_LEADER" && " · 부그룹장"}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-slate-400">›</span>
                </button>
              ))}
            </div>
          )}
          {!groupsLoading && (!myGroups || myGroups.length === 0) && (
            <p className="text-sm text-muted-foreground">
              아직 속한 그룹이 없습니다.
            </p>
          )}

          {/* 초대 코드 가입 */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setInviteMessage(null);
              }}
              placeholder="초대 코드로 참여"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inviteCode.trim()) {
                  joinGroupMutation.mutate(inviteCode.trim());
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!inviteCode.trim() || joinGroupMutation.isPending}
              onClick={() => joinGroupMutation.mutate(inviteCode.trim())}
            >
              가입
            </Button>
          </div>
          {inviteMessage && (
            <p
              className={`text-xs ${
                inviteMessage.type === "error"
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {inviteMessage.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
