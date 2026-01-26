/*
  Warnings:

  - You are about to drop the `pre_registered_students` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "pre_registered_students";

-- CreateTable
CREATE TABLE "students_master" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "number_in_class" INTEGER,
    "prefix" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "room" INTEGER NOT NULL,
    "class_room" TEXT NOT NULL,
    "is_registered" BOOLEAN NOT NULL DEFAULT false,
    "registered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_master_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_master_student_id_key" ON "students_master"("student_id");
