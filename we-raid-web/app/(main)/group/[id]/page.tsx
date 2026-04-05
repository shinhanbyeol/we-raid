"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { ApiResponse, GroupMemberRole } from "@/lib/types/api";
import { Button } from "@/components/ui/button";

// ─── API 응답 타입 ────────────────────────────────────────────

interface GroupDetail {
  id: string;
  name: string;
  gameId: string;
  ownerId: string;
  description: string | null;
  isPublic: boolean;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  game: { id: string; name: string; slug: string };
  owner: { id: string; nickname: string; profileImage: string | null };
  _count: { members: number };
}

interface Member {
  id: string;
  role: GroupMemberRole;
  status: "ACTIVE" | "BANNED";
  joinedAt: string;
  user: { id: string; nickname: string; profileImage: string | null };
}

// ─── 역할 배지 ─────────────────────────────────────────────────

const ROLE_BADGE: Record<GroupMemberRole, { label: string; className: string }> =
  {
    OWNER: { label: "그룹장", className: "bg-slate-900 text-white" },
    SUB_LEADER: { label: "부그룹장", className: "bg-slate-200 text-slate-700" },
    MEMBER: { label: "멤버", className: "bg-slate-100 text-slate-500" },
  };

// ─── 아바타 ────────────────────────────────────────────────────

const Avatar = ({
  src,
  name,
  size = "sm",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md";
}) => {
  const cls =
    size === "sm"
      ? "size-8 text-xs"
      : "size-10 text-sm";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`${cls} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-medium text-slate-600`}
    >
      {name[0]}
    </div>
  );
};

// ─── 메인 페이지 ───────────────────────────────────────────────

const GroupDetailPage = () => {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  // ── 그룹 정보 ────────────────────────────────────────────────
  const {
    data: group,
    isLoading: groupLoading,
    isError: groupError,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GroupDetail>>(`/groups/${groupId}`);
      return res.data.data;
    },
    retry: false,
  });

  // ── 멤버 목록 ────────────────────────────────────────────────
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["group", groupId, "members"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Member[]>>(
        `/groups/${groupId}/members`,
      );
      return res.data.data;
    },
    enabled: !!group,
  });

  const myMember = members?.find((m) => m.user.id === user?.id);
  const myRole = myMember?.role;
  const isOwner = myRole === "OWNER";
  const isLeader = myRole === "OWNER" || myRole === "SUB_LEADER";

  // ── 역할 변경 ────────────────────────────────────────────────
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      role,
    }: {
      targetUserId: string;
      role: "SUB_LEADER" | "MEMBER";
    }) => {
      await api.patch(`/groups/${groupId}/members/${targetUserId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId, "members"] });
    },
  });

  // ── 강퇴 / 탈퇴 ──────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await api.delete(`/groups/${groupId}/members/${targetUserId}`);
    },
    onSuccess: (_, targetUserId) => {
      if (targetUserId === user?.id) {
        // 본인 탈퇴 → 홈으로
        queryClient.invalidateQueries({ queryKey: ["groups", "mine"] });
        router.push("/home");
      } else {
        queryClient.invalidateQueries({
          queryKey: ["group", groupId, "members"],
        });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      setKickTarget(null);
      setConfirmLeave(false);
    },
  });

  // ── 멤버 초대 ────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/groups/${groupId}/invite`, { userId });
    },
    onSuccess: () => {
      setInviteUserId("");
      setShowInviteForm(false);
      setInviteError("");
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "members"],
      });
    },
    onError: () => {
      setInviteError("초대에 실패했습니다. 유저 ID를 확인해주세요.");
    },
  });

  const copyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── 로딩 / 에러 ──────────────────────────────────────────────
  if (groupLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-slate-500">불러오는 중...</p>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-500">그룹을 찾을 수 없습니다.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/home")}
        >
          홈으로
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* 헤더 내비게이션 */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          ← 뒤로
        </button>
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/group/${groupId}/setting`)}
          >
            그룹 설정
          </Button>
        )}
      </div>

      {/* 그룹 헤더 */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-slate-900">
                {group.name}
              </h1>
              {group.isPublic && (
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  공개
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {group.game.name} · 멤버 {group._count.members}명
            </p>
            {group.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                {group.description}
              </p>
            )}
          </div>
          <Avatar
            src={group.owner.profileImage}
            name={group.owner.nickname}
            size="md"
          />
        </div>

        {/* 초대 코드 */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">초대 코드</p>
            <p className="truncate font-mono text-sm font-medium text-slate-700">
              {group.inviteCode}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={copyInviteCode}
            className="shrink-0"
          >
            {copied ? "복사됨!" : "복사"}
          </Button>
        </div>

        <p className="mt-1 text-xs text-slate-400">
          그룹장:{" "}
          <span className="text-slate-600">{group.owner.nickname}</span> · 생성일{" "}
          {format(parseISO(group.createdAt), "yyyy.M.d", { locale: ko })}
        </p>
      </div>

      {/* 멤버 목록 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            멤버
            {members && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                {members.length}명
              </span>
            )}
          </h2>
          {isLeader && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowInviteForm((v) => !v);
                setInviteError("");
              }}
            >
              + 초대
            </Button>
          )}
        </div>

        {/* 초대 폼 */}
        {showInviteForm && (
          <div className="border-b border-slate-100 px-6 py-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteUserId}
                onChange={(e) => {
                  setInviteUserId(e.target.value);
                  setInviteError("");
                }}
                placeholder="유저 ID 입력"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <Button
                size="sm"
                disabled={!inviteUserId.trim() || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate(inviteUserId.trim())}
              >
                {inviteMutation.isPending ? "초대 중..." : "초대"}
              </Button>
            </div>
            {inviteError && (
              <p className="mt-1 text-xs text-red-500">{inviteError}</p>
            )}
          </div>
        )}

        {/* 멤버 목록 */}
        {membersLoading ? (
          <p className="px-6 py-4 text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {members?.map((member) => {
              const badge = ROLE_BADGE[member.role];
              const isSelf = member.user.id === user?.id;
              const canChangeRole =
                isOwner && !isSelf && member.role !== "OWNER";
              const canKick =
                !isSelf &&
                ((isOwner && member.role !== "OWNER") ||
                  (myRole === "SUB_LEADER" && member.role === "MEMBER"));

              return (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-6 py-3.5"
                >
                  <Avatar
                    src={member.user.profileImage}
                    name={member.user.nickname}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {member.user.nickname}
                        {isSelf && (
                          <span className="ml-1 text-slate-400">(나)</span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {format(parseISO(member.joinedAt), "yyyy.M.d 가입", {
                        locale: ko,
                      })}
                    </p>
                  </div>

                  {/* 역할 변경 (OWNER만) */}
                  {canChangeRole && (
                    <select
                      value={member.role}
                      disabled={updateRoleMutation.isPending}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          targetUserId: member.user.id,
                          role: e.target.value as "SUB_LEADER" | "MEMBER",
                        })
                      }
                      className="shrink-0 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:outline-none"
                    >
                      <option value="SUB_LEADER">부그룹장</option>
                      <option value="MEMBER">멤버</option>
                    </select>
                  )}

                  {/* 강퇴 */}
                  {canKick && (
                    <>
                      {kickTarget === member.user.id ? (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setKickTarget(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 text-white hover:bg-red-600"
                            disabled={removeMutation.isPending}
                            onClick={() =>
                              removeMutation.mutate(member.user.id)
                            }
                          >
                            강퇴
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-red-500 hover:text-red-600"
                          onClick={() => setKickTarget(member.user.id)}
                        >
                          강퇴
                        </Button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 탈퇴 버튼 (OWNER 제외) */}
      {myMember && !isOwner && (
        <div className="mt-6 flex justify-end">
          {confirmLeave ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">정말 탈퇴하시겠습니까?</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmLeave(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(user!.id)}
              >
                {removeMutation.isPending ? "처리 중..." : "탈퇴"}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={() => setConfirmLeave(true)}
            >
              그룹 탈퇴
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
