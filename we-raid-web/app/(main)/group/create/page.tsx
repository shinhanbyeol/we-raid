"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, Game, Group } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreateGroupPage = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Game[]>>("/games");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<Group>>("/groups", {
        name: name.trim(),
        gameId: selectedGame!.id,
        description: description.trim() || undefined,
        isPublic,
      });
      return res.data.data;
    },
    onSuccess: (group) => {
      router.push(`/group/${group.id}`);
    },
    onError: () => {
      setError("그룹 생성에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const handleSubmit = () => {
    setError("");
    if (name.trim().length < 2) {
      setError("그룹 이름은 2자 이상 입력해주세요.");
      return;
    }
    if (!selectedGame) {
      setError("게임을 선택해주세요.");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">새 그룹 만들기</h1>
        <p className="mt-1 text-sm text-slate-500">
          레이드 파티를 위한 그룹을 만들어보세요.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* 그룹 이름 */}
        <div className="space-y-1.5">
          <label
            htmlFor="group-name"
            className="text-sm font-medium text-slate-700"
          >
            그룹 이름 <span className="text-red-500">*</span>
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="그룹 이름 (2~30자)"
            maxLength={30}
          />
          <p className="text-xs text-slate-400">{name.length} / 30</p>
        </div>

        {/* 게임 선택 */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">
            게임 <span className="text-red-500">*</span>
          </p>
          {gamesLoading ? (
            <p className="text-sm text-slate-500">게임 목록 불러오는 중...</p>
          ) : (
            <div className="grid gap-2">
              {games?.map((game) => (
                <button
                  type="button"
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    selectedGame?.id === game.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {game.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.thumbnailUrl}
                      alt=""
                      className="size-8 rounded object-cover"
                    />
                  )}
                  {game.name}
                </button>
              ))}
              {games?.length === 0 && (
                <p className="text-sm text-slate-500">
                  등록된 게임이 없습니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 그룹 설명 */}
        <div className="space-y-1.5">
          <label
            htmlFor="group-description"
            className="text-sm font-medium text-slate-700"
          >
            그룹 설명
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="그룹 소개를 입력해주세요 (선택)"
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="text-xs text-slate-400">{description.length} / 200</p>
        </div>

        {/* 공개 여부 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700">공개 그룹</p>
            <p className="text-xs text-slate-500">
              공개 그룹은 초대 코드 없이 검색으로 찾을 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isPublic ? "bg-slate-900" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={createMutation.isPending || gamesLoading}
          >
            {createMutation.isPending ? "생성 중..." : "그룹 만들기"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPage;
