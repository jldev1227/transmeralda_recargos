import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/use-disclosure";
import { AlertTriangle, FileText } from "lucide-react";

interface LiquidarRecargoConfirmProps {
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  planillas: string[];
}

/**
 * Componente de diálogo de confirmación para liquidar recargos
 */
const LiquidarRecargoConfirm: React.FC<LiquidarRecargoConfirmProps> = ({
  title = "Confirmar liquidación",
  message,
  confirmText = "Liquidar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isOpen,
  onClose,
  isLoading = false,
  planillas,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      size="md"
      isDismissable={!isLoading}
      hideCloseButton={isLoading}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {planillas.length} planilla{planillas.length > 1 ? "s" : ""} seleccionada{planillas.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                {message && (
                  <div className="text-gray-700">
                    {typeof message === "string" ? (
                      <p>{message}</p>
                    ) : (
                      <div>{message}</div>
                    )}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="text-yellow-600 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">
                        Esta acción liquidará los recargos seleccionados
                      </p>
                      <p>
                        Las siguientes planillas serán liquidadas. Por favor verifica que sean correctas antes de continuar.
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {planillas.map((num) => (
                      <li key={num} className="flex items-center gap-2 text-gray-700">
                        <FileText size={14} className="text-yellow-600" />
                        <span className="font-mono">{num}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <div className="flex justify-end gap-3 w-full">
                <Button
                  variant="flat"
                  onPress={handleCancel}
                  isDisabled={isLoading}
                  className="text-gray-700"
                >
                  {cancelText}
                </Button>
                <Button
                  color="warning"
                  variant="flat"
                  onPress={handleConfirm}
                  isLoading={isLoading}
                  startContent={!isLoading ? <AlertTriangle size={16} /> : null}
                >
                  {confirmText}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LiquidarRecargoConfirm;

/**
 * Hook personalizado para usar el modal de confirmación de liquidación
 */
export const useLiquidarRecargoConfirm = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<
    Omit<LiquidarRecargoConfirmProps, "isOpen" | "onClose">
  >({
    title: "Confirmar liquidación",
    message: "¿Estás seguro de que quieres liquidar los recargos seleccionados?",
    confirmText: "Liquidar",
    cancelText: "Cancelar",
    planillas: [],
    onConfirm: () => {},
    isLoading: false,
  });

  const confirm = (
    options: Partial<Omit<LiquidarRecargoConfirmProps, "isOpen" | "onClose">>,
  ) => {
    return new Promise<{ confirmed: boolean }>((resolve) => {
      const newConfig = {
        ...config,
        ...options,
        onConfirm: () => {
          if (options.onConfirm) {
            options.onConfirm();
          }
          resolve({ confirmed: true });
          onClose();
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel();
          }
          resolve({ confirmed: false });
          onClose();
        },
        isLoading,
      };

      setConfig(newConfig);
      onOpen();
    });
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
    setConfig({ ...config, isLoading: loading });
  };

  const DialogComponent = (
    <LiquidarRecargoConfirm {...config} isOpen={isOpen} onClose={onClose} />
  );

  return {
    confirm,
    setLoading,
    isLoading,
    DialogComponent,
    isOpen,
    onClose,
  };
};
