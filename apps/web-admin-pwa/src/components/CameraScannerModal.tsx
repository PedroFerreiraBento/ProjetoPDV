import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@pos/ui'
import { X } from 'lucide-react'

interface CameraScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onScan: (barcode: string) => void
}

export function CameraScannerModal({ isOpen, onClose, onScan }: CameraScannerModalProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        if (!isOpen) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
                scannerRef.current = null
            }
            return
        }

        setError('')

        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            'reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
            },
            /* verbose= */ false
        )

        scannerRef.current = scanner

        try {
            scanner.render(
                (decodedText) => {
                    // On success: clear scanner and trigger callback
                    if (scannerRef.current) {
                        try {
                            scannerRef.current.clear().catch(console.error)
                        } catch (e) { }
                        scannerRef.current = null
                    }
                    onScan(decodedText)
                    onClose()
                },
                (errorMessage) => {
                    // On error, usually just means no barcode in frame yet
                    // console.warn(errorMessage)
                }
            )
        } catch (err: any) {
            setError(err.message || 'Failed to initialize camera')
        }

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(console.error)
                } catch (e) { }
                scannerRef.current = null
            }
        }
    }, [isOpen, onScan, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Ler Código de Barras</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-4 flex flex-col items-center">
                    {error && (
                        <div className="w-full p-3 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* The div where html5-qrcode will mount its video feed */}
                    <div id="reader" className="w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-950 min-h-[300px]" />

                    <p className="mt-4 text-sm text-slate-500 text-center">
                        Aponte a câmera para o código de barras ou QR Code do produto.
                    </p>
                </div>
            </div>
        </div>
    )
}
