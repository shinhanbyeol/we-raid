-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "serverId" TEXT,
    "serverName" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'DPS',
    "isMain" BOOLEAN NOT NULL DEFAULT true,
    "mainCharId" TEXT,
    "specText" TEXT,
    "specImageUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "specIsPublic" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Character_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "GameServer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Character_mainCharId_fkey" FOREIGN KEY ("mainCharId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("avatarUrl", "createdAt", "gameId", "id", "isDeleted", "isVerified", "nickname", "role", "serverId", "serverName", "specImageUrl", "specIsPublic", "specText", "updatedAt", "userId") SELECT "avatarUrl", "createdAt", "gameId", "id", "isDeleted", "isVerified", "nickname", "role", "serverId", "serverName", "specImageUrl", "specIsPublic", "specText", "updatedAt", "userId" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE INDEX "Character_userId_gameId_idx" ON "Character"("userId", "gameId");
CREATE INDEX "Character_mainCharId_idx" ON "Character"("mainCharId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
