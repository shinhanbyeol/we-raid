"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { ApiResponse, GroupMemberRole } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── 타입 ──────────────────────────────────────────────────────

interface GroupDetail {
  id: string;
  name: string;
  ownerId: string;
  description: string | null;
  isPublic: boolean;
  inviteCode: string;
  createdAt: string;
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

// ─── 역할 표시 ─────────────────────────────────────────────────

const ROLE_BADGE: Record<GroupMemberRole, { label: string; className: string }> =
  {
    OWNER: { label: "그룹장", className: "bg-slate-900 text-white" },
    SUB_LEADER: { label: "부그룹장", className: "bg-slate-200 text-slate-700" },
    MEMBER: { label: "멤버", className: "bg-slate-100 text-slate-500" },
  };

const Avatar = ({ src, name }: { src: string | null; name: string }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="size-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
      {name[0]}
    </div>
  );

// ─── 페이지 ────────────────────────────────────────────────────

const GroupSettingPage = () => {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ── 그룹 정보 수정 폼 상태
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── 삭제 확인
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteZone, setShowDeleteZone] = useState(false);

  // ── 강퇴 확인
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  // ── 그룹 정보 조회
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GroupDetail>>(`/groups/${groupId}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (group && !formReady) {
      setEditName(group.name);
      setEditDescription(group.description ?? "");
      setEditIsPublic(group.isPublic);
      setFormReady(true);
    }
  }, [group, formReady]);

  // ── 멤버 목록
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

  const myRole = members?.find((m) => m.user.id === user?.id)?.role;
  const isOwner = myRole === "OWNER";

  // ── 그룹 정보 수정
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch<ApiResponse<GroupDetail>>(
        `/groups/${groupId}`,
        {
          name: editName.trim(),
          description: editDescription.trim() || null,
          isPublic: editIsPublic,
        },
      );
      return res.data.data;
    },
    onSuccess: (updated) => {
      setSaveError("");
      queryClient.setQueryData(["group", groupId], updated);
      queryClient.invalidateQueries({ queryKey: ["groups", "mine"] });
    },
    onError: () => setSaveError("저장에 실패했습니다. 다시 시도해주세요."),
  });

  // ── 역할 변경
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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "members"],
      }),
  });

  // ── 강퇴
  const kickMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await api.delete(`/groups/${groupId}/members/${targetUserId}`);
    },
    onSuccess: () => {
      setKickTarget(null);
      queryClient.invalidateQueries({ queryKey: ["group", groupId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });

  // ── 그룹 삭제
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", "mine"] });
      router.push("/home");
    },
  });

  const handleSave = () => {
    setSaveError("");
    if (editName.trim().length < 2) {
      setSaveError("그룹 이름은 2자 이상 입력해주세요.");
      return;
    }
    updateMutation.mutate();
  };

  // ── 로딩 / 권한 체크
  if (groupLoading || !group) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-slate-500">불러오는 중...</p>
      </div>
    );
  }

  if (!isOwner && myRole !== undefined) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-500">그룹장만 접근할 수 있습니다.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.back()}
        >
          뒤로
        </Button>
      </div>
    );
  }

  const isDirty =
    editName.trim() !== group.name ||
    (editDescription.trim() || null) !== group.description ||
    editIsPublic !== group.isPublic;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">그룹 설정</h1>
          <p className="text-sm text-slate-500">{group.name}</p>
        </div>
      </div>

      {/* ── 그룹 정보 수정 ── */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">기본 정보</h2>

        <div className="space-y-4">
          {/* 그룹 이름 */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-name"
              className="text-sm font-medium text-slate-700"
            >
              그룹 이름
            </label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-slate-400">{editName.length} / 30</p>
          </div>

          {/* 그룹 설명 */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-desc"
              className="text-sm font-medium text-slate-700"
            >
              그룹 설명
            </label>
            <textarea
              id="edit-desc"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="그룹 소개 (선택)"
            />
            <p className="text-xs text-slate-400">
              {editDescription.length} / 200
            </p>
          </div>

          {/* 공개 여부 */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">공개 그룹</p>
              <p className="text-xs text-slate-500">
                초대 코드 없이 검색으로 찾을 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={editIsPublic}
              onClick={() => setEditIsPublic((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                editIsPublic ? "bg-slate-900" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                  editIsPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <Button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? "저장 중..." : "저장"}
          </Button>
          {updateMutation.isSuccess && !isDirty && (
            <p className="text-center text-xs text-green-600">저장되었습니다.</p>
          )}
        </div>
      </section>

      {/* ── 멤버 관리 ── */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            멤버 관리
            {members && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                {members.length}명
              </span>
            )}
          </h2>
        </div>

        {membersLoading ? (
          <p className="px-6 py-4 text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {members?.map((member) => {
              const badge = ROLE_BADGE[member.role];
              const isSelf = member.user.id === user?.id;
              const canChangeRole = !isSelf && member.role !== "OWNER";
              const canKick = !isSelf && member.role !== "OWNER";

              return (
                <li key={member.id} className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
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

                    <div className="flex shrink-0 items-center gap-2">
                      {/* 역할 변경 드롭다운 */}
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
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:outline-none"
                        >
                          <option value="SUB_LEADER">부그룹장</option>
                          <option value="MEMBER">멤버</option>
                        </select>
                      )}

                      {/* 강퇴 */}
                      {canKick &&
                        (kickTarget === member.user.id ? (
                          <div className="flex gap-1">
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
                              disabled={kickMutation.isPending}
                              onClick={() =>
                                kickMutation.mutate(member.user.id)
                              }
                            >
                              강퇴
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setKickTarget(member.user.id)}
                          >
                            강퇴
                          </Button>
                        ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── 위험 구역 ── */}
      <section className="rounded-xl border border-red-200 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          onClick={() => setShowDeleteZone((v) => !v)}
        >
          <h2 className="font-semibold text-red-600">위험 구역</h2>
          <span className="text-slate-400">{showDeleteZone ? "▲" : "▼"}</span>
        </button>

        {showDeleteZone && (
          <div className="border-t border-red-100 px-6 py-5">
            <p className="mb-1 text-sm font-medium text-slate-800">
              그룹 삭제
            </p>
            <p className="mb-4 text-sm text-slate-500">
              그룹을 삭제하면 모든 멤버가 제거됩니다. 이 작업은 되돌릴 수
              없습니다.
            </p>
            <p className="mb-2 text-sm text-slate-600">
              확인을 위해{" "}
              <span className="font-mono font-semibold text-red-600">
                {group.name}
              </span>
              을(를) 입력하세요.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={group.name}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <Button
                size="sm"
                className="shrink-0 bg-red-600 text-white hover:bg-red-700"
                disabled={
                  deleteConfirmText !== group.name || deleteMutation.isPending
                }
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "삭제 중..." : "그룹 삭제"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default GroupSettingPage;
