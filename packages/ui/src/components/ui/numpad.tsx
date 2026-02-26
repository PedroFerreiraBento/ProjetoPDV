import { Button } from './button'
import { Delete } from 'lucide-react'

interface NumpadProps {
    onKeyPress: (key: string) => void
    onBackspace: () => void
    maxLength?: number
    currentLength?: number
    showDecimal?: boolean
}

export function Numpad({ onKeyPress, onBackspace, maxLength = 10, currentLength = 0, showDecimal = false }: NumpadProps) {
    const handleKeyClick = (key: string) => {
        if (currentLength < maxLength) {
            onKeyPress(key)
        }
    }

    const digits = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
        { label: '6', value: '6' },
        { label: '7', value: '7' },
        { label: '8', value: '8' },
        { label: '9', value: '9' },
        { label: showDecimal ? ',' : '', value: showDecimal ? ',' : '' },
        { label: '0', value: '0' },
    ]

    return (
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
            {digits.map((digit, i) => (
                <div key={i} className="aspect-square flex justify-center items-center">
                    {digit.value !== '' ? (
                        <Button
                            variant="outline"
                            className="w-full h-full text-2xl rounded-2xl shadow-sm hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            onClick={() => handleKeyClick(digit.value)}
                        >
                            {digit.label}
                        </Button>
                    ) : (
                        <div className="w-full h-full" />
                    )}
                </div>
            ))}
            <div className="aspect-square flex justify-center items-center">
                <Button
                    variant="ghost"
                    className="w-full h-full text-slate-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    onClick={onBackspace}
                >
                    <Delete className="h-8 w-8" strokeWidth={1.5} />
                </Button>
            </div>
        </div>
    )
}
