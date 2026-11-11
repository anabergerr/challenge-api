export const COMMANDS = [
  { key: "M", label: "Mover", detail: "Avança 1 casa na direção em que a sonda está apontando." },
  { key: "L", label: "Esquerda", detail: "Gira 90° para a esquerda, sem sair do lugar." },
  { key: "R", label: "Direita", detail: "Gira 90° para a direita, sem sair do lugar." },
] as const;

/** Valid keys, in the order they appear on the buttons. */
export const COMMAND_KEYS = COMMANDS.map((command) => command.key);
