"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
import { sessionExpired } from "@/lib/authClient";
import { GameForm } from "@/components/GameForm";
import { Pencil } from "lucide-react";
import styles from "./GameForm.module.css";

export function GameEditButton({ game }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleEdit(data) {
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        setOpen(false);
        sessionExpired();
        return;
      }
      if (!res.ok) throw new Error("Não foi possível salvar as alterações.");
      setOpen(false);
      // Revalida a página para mostrar os dados atualizados
      router.refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.editBtn}
        onClick={() => setOpen(true)}
      >
        <Pencil className={styles.editIcon} />
        <span>Editar jogo</span>
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Editar jogo">
        <GameForm
          initialData={game}
          onSubmit={handleEdit}
          onCancel={() => setOpen(false)}
          loading={saving}
        />
      </Modal>
    </>
  );
}
