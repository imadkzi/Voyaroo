"use client";

import { useMemo, useState, useTransition } from "react";
import styles from "../styles/pages/TripSubpage.module.scss";

export type ChecklistItemDto = {
  id: string;
  label: string;
  done: boolean;
};

export function TripChecklist({
  tripSlug,
  initialItems,
}: {
  tripSlug: string;
  initialItems: ChecklistItemDto[];
}) {
  const [items, setItems] = useState<ChecklistItemDto[]>(initialItems);
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const remaining = useMemo(() => items.filter((i) => !i.done).length, [items]);

  function add() {
    const next = label.trim();
    if (!next) return;
    setLabel("");
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/checklist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: next }),
      });
      if (!res.ok) {
        setLabel(next);
        console.error("checklist_add_failed", { tripSlug, status: res.status });
        return;
      }
      const json = (await res.json()) as { item?: ChecklistItemDto };
      if (json.item) {
        setItems((prev) => [json.item!, ...prev]);
      }
    });
  }

  function toggle(it: ChecklistItemDto) {
    const optimistic = { ...it, done: !it.done };
    const snapshot = items;
    setItems((prev) => prev.map((x) => (x.id === it.id ? optimistic : x)));
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/checklist/${it.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: optimistic.done }),
      });
      if (!res.ok) {
        setItems(snapshot);
        console.error("checklist_toggle_failed", {
          tripSlug,
          itemId: it.id,
          status: res.status,
        });
      }
    });
  }

  function beginEdit(it: ChecklistItemDto) {
    setEditingId(it.id);
    setEditingLabel(it.label);
  }

  function saveEdit(id: string) {
    const next = editingLabel.trim();
    if (!next) return;
    const snapshot = items;
    setEditingId(null);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, label: next } : x)));
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/checklist/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: next }),
      });
      if (!res.ok) {
        setItems(snapshot);
        console.error("checklist_edit_failed", { tripSlug, itemId: id, status: res.status });
      }
    });
  }

  function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => {
      const res = await fetch(`/api/trips/${tripSlug}/checklist/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setItems(snapshot);
        console.error("checklist_remove_failed", {
          tripSlug,
          itemId: id,
          status: res.status,
        });
      }
    });
  }

  return (
    <div className={styles.stack}>
      <div className={styles.panel}>
        <p className={styles.panel__title}>Checklist</p>
        <p className={styles.panel__text}>
          {remaining ? `${remaining} remaining` : "All done — nice."}
        </p>

        <div className={styles.panel__form}>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Add an item (e.g. Passport / ID)"
            className={styles.panel__input}
          />
          <button
            className={styles.panel__button}
            type="button"
            onClick={add}
            disabled={pending}
          >
            Add
          </button>
        </div>
      </div>

      <div className={styles.cardList}>
        {items.map((it) => (
          <div key={it.id} className={styles.itemCard}>
            <button
              type="button"
              onClick={() => toggle(it)}
              className={[
                styles.checklist__box,
                it.done ? styles["checklist__box--done"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={it.done ? "Mark not done" : "Mark done"}
            >
              {it.done ? "✓" : ""}
            </button>

            <div className={styles.itemCard__content}>
              {editingId === it.id ? (
                <input
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  className={styles.itemCard__input}
                  autoFocus
                />
              ) : (
                <p
                  className={[
                    styles.itemCard__label,
                    it.done ? styles["checklist__label--done"] : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {it.label}
                </p>
              )}
            </div>

            <div className={styles.itemCard__actions}>
              {editingId === it.id ? (
                <>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => saveEdit(it.id)}
                    disabled={pending}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setEditingId(null)}
                    disabled={pending}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => beginEdit(it)}
                    disabled={pending}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.linkButton} ${styles["linkButton--danger"]}`}
                    onClick={() => remove(it.id)}
                    disabled={pending}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {!items.length ? (
          <div className={styles.panel}>
            <p className={styles.panel__text}>No checklist items yet.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

