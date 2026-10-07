"use client";

import { Modal } from "./Modal";

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Alt + S", action: "Focus the top navigation search" },
  { keys: "/", action: "Focus the current page's filter" },
  { keys: "g then h", action: "Go to Hosted zones" },
  { keys: "g then d", action: "Go to Dashboard" },
  { keys: "g then c", action: "Go to Health checks" },
  { keys: "c", action: "Create (hosted zone / record for the current page)" },
  { keys: "Shift + D", action: "Toggle dark mode" },
  { keys: "?", action: "Show this keyboard shortcuts help" },
];

export function ShortcutsHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <table className="shortcuts-table">
        <tbody>
          {SHORTCUTS.map((s) => (
            <tr key={s.keys}>
              <td>
                <kbd className="kbd">{s.keys}</kbd>
              </td>
              <td>{s.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
