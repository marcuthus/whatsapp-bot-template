const brazilPrefix = "55"
const brazilMobileLengthWithNinthDigit = 13
const ninthDigitIndex = 4

export function digits(value: string) {
    return value.replace(/\D/g, "")
}

// Brazilian mobile numbers may or may not carry the extra ninth digit, so it is dropped before comparing.
export function canonicalNumber(value: string) {
    const numbers = digits(value)

    const hasNinthDigit =
        numbers.startsWith(brazilPrefix) &&
        numbers.length === brazilMobileLengthWithNinthDigit &&
        numbers[ninthDigitIndex] === "9"

    return hasNinthDigit ? numbers.slice(0, ninthDigitIndex) + numbers.slice(ninthDigitIndex + 1) : numbers
}

export function sameNumber(first: string, second: string) {
    const canonical = canonicalNumber(first)

    return canonical !== "" && canonical === canonicalNumber(second)
}
