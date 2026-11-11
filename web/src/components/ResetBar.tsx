type Props = {
  probeCount: number;
  confirming: boolean;
  onAskConfirmation: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
};

/** Reset mission, with an inline confirmation step before deleting anything. */
export default function ResetBar({
  probeCount,
  confirming,
  onAskConfirmation,
  onCancel,
  onConfirm,
  busy,
}: Props) {
  return (
    <div className="reset-bar">
      {confirming ? (
        <>
          <span>Recolher todas as {probeCount} sondas e limpar o planalto?</span>
          <button type="button" className="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Reiniciando..." : "Sim, reiniciar missao"}
          </button>
          <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        </>
      ) : (
        <button
          type="button"
          className="ghost"
          onClick={onAskConfirmation}
          disabled={probeCount === 0 || busy}
        >
          Reiniciar missao
        </button>
      )}
    </div>
  );
}
