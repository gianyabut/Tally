import styles from "./ledger.module.css";

export type TileAction = "leave" | "log";

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Calendar with a minus: days going out. */
function LeaveIcon() {
  return (
    <svg className={styles.tileIcon} viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1" style={icon} />
      <path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4M6 10.3h4" style={icon} />
    </svg>
  );
}

/** Calendar with a plus: a day earned. */
function LogIcon() {
  return (
    <svg className={styles.tileIcon} viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1" style={icon} />
      <path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4M6 10.3h4M8 8.3v4" style={icon} />
    </svg>
  );
}

const TILES = [
  { action: "leave", key: "L", title: "File a leave", hint: "VL · SL · IL · UNPAID", Icon: LeaveIcon },
  { action: "log", key: "H", title: "Log holiday work", hint: "EARN AN IL OR OT DAY", Icon: LogIcon },
] as const;

/**
 * The ledger's two main actions as tiles: icon, name, and a mono line on what
 * each does. Desktop shows the L / H key caps (see LedgerView's shortcuts);
 * `pressed` replays the key-cap press when a shortcut fires.
 */
export function ActionTiles({
  onAction,
  showKeys,
  pressed,
  className = "",
}: {
  onAction: (a: TileAction) => void;
  showKeys: boolean;
  pressed: TileAction | null;
  className?: string;
}) {
  return (
    <div className={`${styles.tiles} ${className}`}>
      {TILES.map(({ action, key, title, hint, Icon }) => (
        <button
          key={action}
          type="button"
          className={[
            styles.tile,
            action === "leave" ? styles.tilePrimary : "",
            pressed === action ? styles.tilePressed : "",
          ].join(" ")}
          onClick={() => onAction(action)}
          aria-keyshortcuts={showKeys ? key : undefined}
        >
          <span className={styles.tileTop}>
            <Icon />
            {showKeys && <kbd className={styles.tileKey}>{key}</kbd>}
          </span>
          <span className={styles.tileTitle}>{title}</span>
          <span className={styles.tileHint}>{hint}</span>
        </button>
      ))}
    </div>
  );
}
