"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContent } from "@/components/layout/Page";
import { Button } from "@/components/ui";
import styles from "./error.module.css";

// Erro ao carregar qualquer página logada (ex.: banco fora do ar). Aparece
// dentro da moldura do layout, então a navegação continua disponível.
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  function retry() {
    // Busca os dados do servidor de novo e só então redesenha a página
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <PageContent>
      <div className={styles.box} role="alert">
        <h1 className={styles.title}>Não foi possível carregar a página</h1>
        <p className={styles.text}>
          Pode ser uma falha momentânea de conexão com o banco de dados.
        </p>
        <Button variant="outline" onClick={retry}>
          Tentar de novo
        </Button>
      </div>
    </PageContent>
  );
}
