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
import { Trash2, AlertTriangle } from "lucide-react";

interface EliminarRecargoConfirmProps {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  selectedCount?: number;
}

/**
 * Componente de diálogo de confirmación para eliminar recargos
 */
const EliminarRecargoConfirm: React.FC<EliminarRecargoConfirmProps> = ({
  title = "Confirmar eliminación",
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isOpen,
  onClose,
  isLoading = false,
  selectedCount = 0,
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
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                  {selectedCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {selectedCount} recargo{selectedCount > 1 ? "s" : ""}{" "}
                      seleccionado{selectedCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                <div className="text-gray-700">
                  {typeof message === "string" ? (
                    <p>{message}</p>
                  ) : (
                    <div>{message}</div>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="text-red-600 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">
                        Esta acción es irreversible
                      </p>
                      <p>
                        Los recargos eliminados no podrán ser recuperados.
                        Asegúrate de que realmente deseas continuar.
                      </p>
                    </div>
                  </div>
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
                  color="danger"
                  variant="flat"
                  onPress={handleConfirm}
                  isLoading={isLoading}
                  startContent={!isLoading ? <Trash2 size={16} /> : null}
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

export default EliminarRecargoConfirm;

/**
 * Hook personalizado para usar el modal de confirmación de eliminación
 */
export const useEliminarRecargoConfirm = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<
    Omit<EliminarRecargoConfirmProps, "isOpen" | "onClose">
  >({
    title: "Confirmar eliminación",
    message: "¿Estás seguro de que quieres eliminar este recargo?",
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    selectedCount: 0,
    onConfirm: () => {},
    isLoading: false,
  });

  const confirm = (
    options: Partial<Omit<EliminarRecargoConfirmProps, "isOpen" | "onClose">>,
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
    <EliminarRecargoConfirm {...config} isOpen={isOpen} onClose={onClose} />
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
