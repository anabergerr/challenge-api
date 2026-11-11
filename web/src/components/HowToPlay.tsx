import { COMMANDS } from "../lib/commands";

const STEPS = [
  {
    title: "Configure o planalto",
    detail:
      "Largura e altura são o canto superior direito da malha. Um planalto 5x3 vira uma grade de 6 por 4, porque a contagem começa em 0.",
  },
  {
    title: "Lance a sonda",
    detail:
      "Toda sonda nasce em (0, 0), no canto inferior esquerdo, virada para a direção escolhida. A API devolve um ID.",
  },
  {
    title: "Monte a sequência",
    detail:
      "Escolha a sonda, digite letras como MRM (ou clique nos botões) e execute. Cada letra é uma ordem.",
  },
  {
    title: "Acompanhe a missão",
    detail:
      "A seta no planalto mostra onde a sonda está e para onde aponta. A tabela lista todas as sondas.",
  },
];

export default function HowToPlay() {
  return (
    <section className="help" aria-labelledby="help-title">
      <h2 id="help-title">Como usar</h2>

      <ol className="steps">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="step-number">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3>Comandos</h3>
      <div className="legend">
        {COMMANDS.map((command) => (
          <div key={command.key} className="legend-item">
            <kbd>{command.key}</kbd>
            <div>
              <strong>{command.label}</strong>
              <p>{command.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="tips">
        <strong>Exemplo:</strong> saindo de (0, 0) olhando para NORTH, a sequência{" "}
        <code>MRM</code> termina em (1, 1) olhando para EAST — anda para cima, vira à direita
        e anda para o lado.
      </p>

      <p className="tips warn">
        <strong>Sequência inválida:</strong> se algum comando tirar a sonda do planalto (ou não
        for M, L ou R), <em>nada</em> é executado e a sonda fica exatamente onde estava.
      </p>
    </section>
  );
}
