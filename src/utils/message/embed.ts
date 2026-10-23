interface Field {
    name: string
    value: string
}

interface Author {
    name: string
    emoji: string
}

interface Footer {
    text: string
    emoji: string
}

// WhatsApp formatting: *bold*, _italic_, ~strike~ and `monospace`.
export class Embed {
    private author = ""
    private title = ""
    private description = ""
    private fields = ""
    private timestamp = ""
    private footer = ""

    public setAuthor(author: Author) {
        this.author = `*${author.emoji} ${author.name}*`
        return this
    }

    public setTitle(title: string) {
        this.title = `*${title}*`
        return this
    }

    public setDescription(description: string) {
        this.description = description
        return this
    }

    public setFields(fields: Field[]) {
        this.fields = fields.map((field) => `*${field.name}:*\n${field.value}\n`).join("\n")
        return this
    }

    public setTimestamp(timestamp: Date = new Date()) {
        this.timestamp = `_${timestamp.toLocaleDateString("pt-br")}, ${timestamp.toLocaleTimeString("pt-br")}_`
        return this
    }

    public setFooter(footer: Footer) {
        this.footer = `_*${footer.emoji} ${footer.text}*_`
        return this
    }

    public build() {
        const bottom = [this.footer, this.timestamp].filter(Boolean).join(" | ")

        return [this.author, this.title, this.description, this.fields, bottom].filter(Boolean).join("\n\n").trim()
    }
}
