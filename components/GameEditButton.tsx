"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { showError } from "@/components/ui/Toaster";
import { GameForm } from "@/components/GameForm";
import { api, errorText } from "@/lib/api";
import type { Game, GameInput } from "@/lib/gamesData";

// Botão "Editar jogo" da página de um jogo (app/games/[id]).
export function GameEditButton({
  game,
  platforms,
}: {
  game: Game;
  /** Plataformas escolhidas nas configurações (vazio = todas) */
  platforms: string[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleEdit(data: GameInput) {
    setSaving(true);
    try {
      await api(`/api/games/${game.id}`, {
        method: "PUT",
        body: data,
        errorMessage: "Não foi possível salvar as alterações.",
      });
      setOpen(false);
      // Busca a página de novo no servidor para mostrar os dados atualizados
      router.refresh();
    } catch (e) {
      showError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil />
        Editar jogo
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Editar jogo">
        <GameForm
          initialData={game}
          onSubmit={handleEdit}
          onCancel={() => setOpen(false)}
          loading={saving}
          platforms={platforms}
        />
      </Modal>
    </>
  );
}
