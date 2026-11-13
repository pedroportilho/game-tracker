"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
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
      if (!res.ok) throw new Error("Failed to update game");
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
        <span>Edit game</span>
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit game">
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
