import { styleText } from "node:util"

import { GroupMultiSelectPrompt } from "@clack/core"

export type Item = { name: string; version?: string }
type Option = { value: string; label: string; hint?: string }

const symbols = {
  initial: "◆",
  active: "◆",
  validating: "◆",
  error: "▲",
  submit: "◇",
  cancel: "■"
} as const

export function pick(message: string, groups: Record<string, Item[]>) {
  const width = Math.max(...Object.values(groups).flatMap((items) => items.map((item) => item.name.length)))
  const options = Object.fromEntries(
    Object.entries(groups).map(([group, items]) => [
      group,
      items.map((item) => ({ value: item.name, label: item.name, hint: item.version }))
    ])
  )
  return new GroupMultiSelectPrompt<Option>({
    options,
    required: false,
    selectableGroups: false,
    render() {
      const head = `${styleText("cyan", symbols[this.state])}  ${message}\n`
      const chosen = this.value ?? []
      if (this.state === "submit" || this.state === "cancel") {
        return `${head}${styleText("gray", "│")}  ${styleText("dim", chosen.join(", "))}`
      }
      const bar = styleText("cyan", "│")
      const lines = this.options.map((option, index) => {
        const label = option.label
        if (option.group === true) return `${bar}  ${styleText("bold", label)}`
        const active = index === this.cursor
        const selected = chosen.includes(option.value)
        const box = selected ? styleText("green", "◼") : styleText(active ? "cyan" : "dim", "◻")
        const current = option.hint ? `${" ".repeat(width - label.length + 2)}${styleText("dim", option.hint)}` : ""
        return `${bar}    ${box} ${active ? label : styleText("dim", label)}${current}`
      })
      return `${head}${lines.join("\n")}\n${styleText("cyan", "└")}\n`
    }
  }).prompt()
}
