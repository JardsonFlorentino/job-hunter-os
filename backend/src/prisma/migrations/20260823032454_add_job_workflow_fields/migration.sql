-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDENTE', 'APLICADO', 'REJEITADO', 'ENTREVISTA', 'TESTES', 'IGNORADO');

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "github" TEXT,
    "linkedin" TEXT,
    "portfolio" TEXT,
    "pretensao_clt" DECIMAL(12,2),
    "pretensao_pj" DECIMAL(12,2),
    "anos_experiencia" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "localizacao" TEXT,
    "salario_informado" TEXT,
    "descricao" TEXT,
    "contato_email" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "message_id" TEXT,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "erro" TEXT,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_email_key" ON "candidate_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_link_key" ON "jobs"("link");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_empresa_idx" ON "jobs"("empresa");

-- CreateIndex
CREATE INDEX "jobs_contato_email_idx" ON "jobs"("contato_email");

-- CreateIndex
CREATE INDEX "email_logs_job_id_idx" ON "email_logs"("job_id");

-- CreateIndex
CREATE INDEX "email_logs_enviado_em_idx" ON "email_logs"("enviado_em");

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
