import { useEffect, useRef } from 'react'

interface UseBarcodeScannerProps {
    onScan: (barcode: string) => void
    timeThreshold?: number
    enabled?: boolean
}

export function useBarcodeScanner({ onScan, timeThreshold = 40, enabled = true }: UseBarcodeScannerProps) {
    const buffer = useRef('')
    const lastKeyTime = useRef<number>(0)

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if event originated from an input or textarea that shouldn't be intercepted
            // Actually, for POS scanning, we often WANT to intercept even if an input is focused,
            // OR we let the input handle it if it specifically wants to.
            // A common approach is to ignore events if default is prevented or it's a modifier key.
            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return

            const currentTime = Date.now()

            // If the time between keypresses is greater than the threshold, 
            // it's likely a human typing, so clear the buffer.
            if (currentTime - lastKeyTime.current > timeThreshold) {
                buffer.current = ''
            }

            if (e.key === 'Enter') {
                if (buffer.current.length > 2) { // Minimal length for a barcode
                    onScan(buffer.current)
                    e.preventDefault() // Prevent form submissions or other default Enter behaviors
                }
                buffer.current = ''
            } else if (e.key.length === 1) { // Only capture printable characters
                buffer.current += e.key
            }

            lastKeyTime.current = currentTime
        }

        window.addEventListener('keydown', handleKeyDown, { capture: true })

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true })
        }
    }, [onScan, timeThreshold, enabled])
}
