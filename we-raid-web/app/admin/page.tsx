"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiResponse } from "@/lib/types/api";

// ── Types ──────────────────────────────────────────────────────────────────

type Game = {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  servers: GameServer[];
  eventTypes: EventType[];
};

type GameServer = {
  id: string;
  gameId: string;
  name: string;
  region: string;
  isActive: boolean;
  displayOrder: number;
};

type EventType = {
  id: string;
  gameId: string | null;
  name: string;
  description: string | null;
  isDefault: boolean;
};

type AdminUser = {
  id: string;
  kakaoId: string;
  nickname: string;
  profileImage: string | null;
  status: "ACTIVE" | "BANNED" | "DELETED";
  isAdmin: boolean;
  createdAt: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const REGION_LABELS: Record<string, string> = {
  KR: "한국",
  NA: "북미",
  EU: "유럽",
  ETC: "기타",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "활성", className: "text-green-600" },
  BANNED: { label: "정지", className: "text-red-600" },
  DELETED: { label: "탈퇴", className: "text-slate-400" },
};

function useInputState(initial = "") {
  const [value, setValue] = useState(initial);
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValue(e.target.value);
  return { value, onChange, setValue };
}

function inputProps(state: ReturnType<typeof useInputState>) {
  return { value: state.value, onChange: state.onChange };
}

// ── Games Tab ──────────────────────────────────────────────────────────────

const GamesTab = () => {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const name = useInputState();
  const slug = useInputState();
  const thumbnailUrl = useInputState();
  const editName = useInputState();
  const editSlug = useInputState();
  const editThumbnail = useInputState();

  const { data: games, isLoading } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Game[]>>("/admin/games");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; thumbnailUrl?: string }) =>
      api.post("/admin/games", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] });
      name.setValue("");
      slug.setValue("");
      thumbnailUrl.setValue("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; slug?: string; thumbnailUrl?: string };
    }) => api.put(`/admin/games/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] });
      setEditId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/admin/games/${id}`, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "games"] }),
  });

  const startEdit = (game: Game) => {
    setEditId(game.id);
    editName.setValue(game.name);
    editSlug.setValue(game.slug);
    editThumbnail.setValue(game.thumbnailUrl ?? "");
  };

  return (
    <div className="space-y-6">
      {/* 게임 추가 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">게임 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <input
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="게임명"
              {...inputProps(name)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="슬러그 (예: lost-ark)"
              {...inputProps(slug)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="썸네일 URL (선택)"
              {...inputProps(thumbnailUrl)}
            />
            <Button
              size="sm"
              disabled={!name.value || !slug.value || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: name.value,
                  slug: slug.value,
                  ...(thumbnailUrl.value
                    ? { thumbnailUrl: thumbnailUrl.value }
                    : {}),
                })
              }
            >
              등록
            </Button>
          </div>
          {createMutation.isError && (
            <p className="mt-2 text-xs text-red-500">등록에 실패했습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 게임 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">게임 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {!isLoading && (!games || games.length === 0) && (
            <p className="text-sm text-muted-foreground">
              등록된 게임이 없습니다.
            </p>
          )}
          <div className="divide-y divide-slate-100">
            {games?.map((game) => (
              <div key={game.id} className="py-3">
                {editId === game.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="게임명"
                      {...inputProps(editName)}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="슬러그"
                      {...inputProps(editSlug)}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      placeholder="썸네일 URL"
                      {...inputProps(editThumbnail)}
                    />
                    <Button
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: game.id,
                          data: {
                            name: editName.value,
                            slug: editSlug.value,
                            ...(editThumbnail.value
                              ? { thumbnailUrl: editThumbnail.value }
                              : {}),
                          },
                        })
                      }
                    >
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditId(null)}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-900">
                        {game.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {game.slug}
                      </span>
                      <span
                        className={`ml-2 text-xs font-medium ${
                          game.isActive ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {game.isActive ? "활성" : "비활성"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(game)}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          game.isActive ? "text-red-500" : "text-green-600"
                        }
                        disabled={toggleActiveMutation.isPending}
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: game.id,
                            isActive: !game.isActive,
                          })
                        }
                      >
                        {game.isActive ? "비활성화" : "활성화"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Servers Tab ────────────────────────────────────────────────────────────

const ServersTab = () => {
  const queryClient = useQueryClient();
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const serverName = useInputState();
  const serverRegion = useInputState("KR");

  const { data: games } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Game[]>>("/admin/games");
      return res.data.data;
    },
  });

  const { data: servers, isLoading } = useQuery({
    queryKey: ["admin", "servers", selectedGameId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GameServer[]>>(
        `/admin/games/${selectedGameId}/servers`,
      );
      return res.data.data;
    },
    enabled: !!selectedGameId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; region: string }) =>
      api.post(`/admin/games/${selectedGameId}/servers`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "servers", selectedGameId],
      });
      serverName.setValue("");
      serverRegion.setValue("KR");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serverId: string) =>
      api.delete(`/admin/games/${selectedGameId}/servers/${serverId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "servers", selectedGameId],
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({
      serverId,
      isActive,
    }: {
      serverId: string;
      isActive: boolean;
    }) =>
      api.put(`/admin/games/${selectedGameId}/servers/${serverId}`, {
        isActive,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "servers", selectedGameId],
      }),
  });

  return (
    <div className="space-y-6">
      {/* 게임 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">게임 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">게임을 선택하세요</option>
            {games?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedGameId && (
        <>
          {/* 서버 추가 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">서버 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="서버명"
                  {...inputProps(serverName)}
                />
                <select
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  {...inputProps(serverRegion)}
                >
                  {Object.entries(REGION_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!serverName.value || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      name: serverName.value,
                      region: serverRegion.value,
                    })
                  }
                >
                  등록
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 서버 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">서버 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              )}
              {!isLoading && (!servers || servers.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  등록된 서버가 없습니다.
                </p>
              )}
              <div className="divide-y divide-slate-100">
                {servers?.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <span className="font-medium text-slate-900">
                        {server.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {REGION_LABELS[server.region] ?? server.region}
                      </span>
                      <span
                        className={`ml-2 text-xs font-medium ${
                          server.isActive ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {server.isActive ? "활성" : "비활성"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          server.isActive ? "text-red-500" : "text-green-600"
                        }
                        disabled={toggleActiveMutation.isPending}
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            serverId: server.id,
                            isActive: !server.isActive,
                          })
                        }
                      >
                        {server.isActive ? "비활성화" : "활성화"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(server.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// ── Event Types Tab ────────────────────────────────────────────────────────

const EventTypesTab = () => {
  const queryClient = useQueryClient();
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const etName = useInputState();
  const etDesc = useInputState();

  const { data: games } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Game[]>>("/admin/games");
      return res.data.data;
    },
  });

  const { data: eventTypes, isLoading } = useQuery({
    queryKey: ["admin", "event-types", selectedGameId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<EventType[]>>(
        `/admin/games/${selectedGameId}/event-types`,
      );
      return res.data.data;
    },
    enabled: !!selectedGameId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post(`/admin/games/${selectedGameId}/event-types`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "event-types", selectedGameId],
      });
      etName.setValue("");
      etDesc.setValue("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/admin/games/${selectedGameId}/event-types/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "event-types", selectedGameId],
      }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">게임 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">게임을 선택하세요</option>
            {games?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedGameId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">이벤트 유형 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="이벤트 유형명 (예: 발탄 하드)"
                  {...inputProps(etName)}
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="설명 (선택)"
                  {...inputProps(etDesc)}
                />
                <Button
                  size="sm"
                  disabled={!etName.value || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      name: etName.value,
                      ...(etDesc.value ? { description: etDesc.value } : {}),
                    })
                  }
                >
                  등록
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">이벤트 유형 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              )}
              {!isLoading && (!eventTypes || eventTypes.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  등록된 이벤트 유형이 없습니다.
                </p>
              )}
              <div className="divide-y divide-slate-100">
                {eventTypes?.map((et) => (
                  <div
                    key={et.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <span className="font-medium text-slate-900">
                        {et.name}
                      </span>
                      {et.description && (
                        <span className="ml-2 text-xs text-slate-500">
                          {et.description}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(et.id)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// ── Users Tab ──────────────────────────────────────────────────────────────

const UsersTab = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdminUser[]>>("/admin/users");
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "BANNED" }) =>
      api.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">유저 목록</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {!isLoading && (!users || users.length === 0) && (
          <p className="text-sm text-muted-foreground">유저가 없습니다.</p>
        )}
        <div className="divide-y divide-slate-100">
          {users?.map((user) => {
            const s = STATUS_LABELS[user.status];
            return (
              <div
                key={user.id}
                className="flex items-center justify-between py-2.5"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {user.nickname}
                  </span>
                  {user.isAdmin && (
                    <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      ADMIN
                    </span>
                  )}
                  <span className={`ml-2 text-xs font-medium ${s.className}`}>
                    {s.label}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {!user.isAdmin && user.status !== "DELETED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={
                      user.status === "ACTIVE"
                        ? "text-red-500"
                        : "text-green-600"
                    }
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({
                        id: user.id,
                        status: user.status === "ACTIVE" ? "BANNED" : "ACTIVE",
                      })
                    }
                  >
                    {user.status === "ACTIVE" ? "정지" : "정지 해제"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────

const AdminPage = () => (
  <div className="container mx-auto max-w-4xl px-4 py-8">
    <h1 className="mb-6 text-2xl font-bold text-slate-900">관리자 대시보드</h1>
    <Tabs defaultValue="games">
      <TabsList className="mb-6">
        <TabsTrigger value="games">게임 관리</TabsTrigger>
        <TabsTrigger value="servers">서버 관리</TabsTrigger>
        <TabsTrigger value="event-types">이벤트 유형</TabsTrigger>
        <TabsTrigger value="users">유저 관리</TabsTrigger>
      </TabsList>
      <TabsContent value="games">
        <GamesTab />
      </TabsContent>
      <TabsContent value="servers">
        <ServersTab />
      </TabsContent>
      <TabsContent value="event-types">
        <EventTypesTab />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab />
      </TabsContent>
    </Tabs>
  </div>
);

export default AdminPage;
