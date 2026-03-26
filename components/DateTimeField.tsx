"use client";

import { useId, useState } from "react";
import styles from "../styles/components/DateTimeField.module.scss";

export function DateTimeField({
  name,
  label,
  placeholder = "Select date & time",
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  const id = useId();
  const [value, setValue] = useState("");

  return (
    <label className={styles.wrap} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <span className={styles.inputWrap}>
        {!value ? <span className={styles.placeholder}>{placeholder}</span> : null}
        <input
          id={id}
          name={name}
          type="datetime-local"
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </span>
    </label>
  );
}

