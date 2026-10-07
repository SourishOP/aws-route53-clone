"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useOutsideClose } from "./useOutsideClose";

export type PropertyOperator = "contains" | "equals";

export interface PropertyDefinition {
  key: string; // backend query param ("" = free text)
  label: string;
  operator: PropertyOperator;
  suggestedValues?: string[];
}

export interface FilterToken {
  property: string;
  label: string;
  value: string;
  operator: PropertyOperator;
}

export interface PropertyFilterProps {
  definitions: PropertyDefinition[];
  tokens: FilterToken[];
  onChange: (tokens: FilterToken[]) => void;
  placeholder?: string;
  allowFreeText?: boolean;
}

export interface PropertyFilterHandle {
  focus: () => void;
}

export const PropertyFilter = forwardRef<
  PropertyFilterHandle,
  PropertyFilterProps
>(function PropertyFilter(
  {
    definitions,
    tokens,
    onChange,
    placeholder = "Filter records by property or value",
    allowFreeText = true,
  },
  ref
) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeProp, setActiveProp] = useState<PropertyDefinition | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      setOpen(true);
    },
  }));

  useOutsideClose(wrapRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) {
      setActiveProp(null);
    }
  }, [open]);

  const addToken = (t: FilterToken) => {
    // Replace an existing token on the same property (except free text, which stacks).
    const kept =
      t.property === ""
        ? tokens
        : tokens.filter((x) => x.property !== t.property);
    onChange([...kept, t]);
    setText("");
    setActiveProp(null);
    setOpen(false);
  };

  const removeToken = (i: number) => {
    onChange(tokens.filter((_, idx) => idx !== i));
  };

  const commitFreeText = () => {
    const v = text.trim();
    if (!v) return;
    addToken({ property: "", label: "Search", value: v, operator: "contains" });
  };

  const commitPropValue = (prop: PropertyDefinition, value: string) => {
    const v = value.trim();
    if (!v) return;
    addToken({
      property: prop.key,
      label: prop.label,
      value: v,
      operator: prop.operator,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeProp) commitPropValue(activeProp, text);
      else if (allowFreeText) commitFreeText();
    } else if (e.key === "Backspace" && text === "" && activeProp) {
      setActiveProp(null);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const propertyDefs = definitions.filter((d) => d.key !== "");

  return (
    <div className="pfilter" ref={wrapRef}>
      <div className="pfilter__bar" onClick={() => inputRef.current?.focus()}>
        <svg
          className="pfilter__glyph"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {tokens.map((t, i) => (
          <span className="pfilter__token" key={`${t.property}-${i}`}>
            <span className="pfilter__token-label">
              {t.label ? `${t.label} = ` : ""}
              {t.value}
            </span>
            <button
              type="button"
              className="pfilter__token-x"
              aria-label={`Remove filter ${t.label} ${t.value}`}
              onClick={(e) => {
                e.stopPropagation();
                removeToken(i);
              }}
            >
              ×
            </button>
          </span>
        ))}

        {/* Active property prompt shown INSIDE the bar, e.g. "Type :" */}
        {activeProp && (
          <span className="pfilter__prompt">{activeProp.label} :</span>
        )}

        <input
          ref={inputRef}
          className="pfilter__input"
          value={text}
          placeholder={
            activeProp
              ? "Enter value…"
              : tokens.length === 0
              ? placeholder
              : ""
          }
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label={placeholder}
        />

        {tokens.length > 0 && (
          <button
            type="button"
            className="pfilter__clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {open && (
        <div className="pfilter__dropdown" role="listbox">
          {!activeProp ? (
            <>
              <div className="pfilter__dropdown-header">Properties</div>
              {propertyDefs.map((d) => (
                <button
                  type="button"
                  key={d.key}
                  className="pfilter__option"
                  onClick={() => {
                    setActiveProp(d);
                    inputRef.current?.focus();
                  }}
                >
                  {d.label}
                </button>
              ))}
              {allowFreeText && text.trim() && (
                <button
                  type="button"
                  className="pfilter__option pfilter__option--use"
                  onClick={commitFreeText}
                >
                  Use: &quot;{text.trim()}&quot;
                </button>
              )}
            </>
          ) : (
            <>
              <div className="pfilter__dropdown-header">
                Use: {activeProp.label} :
              </div>
              {(() => {
                const all = activeProp.suggestedValues ?? [];
                const q = text.trim().toLowerCase();
                const matches = q
                  ? all.filter((v) => v.toLowerCase().includes(q))
                  : all;
                if (matches.length) {
                  return matches.map((v) => (
                    <button
                      type="button"
                      key={v}
                      className="pfilter__option"
                      onClick={() => commitPropValue(activeProp, v)}
                    >
                      {v}
                    </button>
                  ));
                }
                return (
                  <div className="pfilter__hint">
                    {text.trim()
                      ? `Press Enter to filter by "${text.trim()}"`
                      : "No matching values"}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
});
