-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Club" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "facility" INTEGER NOT NULL DEFAULT 60,
    "coachName" TEXT NOT NULL,
    "coachSkill" INTEGER NOT NULL DEFAULT 60,
    "coachSpecialty" TEXT NOT NULL,
    "coach2Name" TEXT NOT NULL DEFAULT '',
    "coach2Specialty" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Club" ("city", "coachName", "coachSkill", "coachSpecialty", "createdAt", "facility", "id", "name") SELECT "city", "coachName", "coachSkill", "coachSpecialty", "createdAt", "facility", "id", "name" FROM "Club";
DROP TABLE "Club";
ALTER TABLE "new_Club" RENAME TO "Club";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
