import React, { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Upload, FileText, Image, X, Eye, AlertCircle } from "lucide-react";

interface ArchivoAdjunto {
  file: File;
  preview?: string;
  pdfDataUrl?: string;
  id: string;
}

interface UploadPlanillaProps {
  onFileChange?: (archivo: File | null) => void;
  maxSizeMB?: number;
  className?: string;
}

const UploadPlanilla: React.FC<UploadPlanillaProps> = ({
  onFileChange,
  maxSizeMB = 10,
  className = "",
}) => {
  const [archivo, setArchivo] = useState<ArchivoAdjunto | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tipos de archivo permitidos
  const tiposPermitidos = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    "image/bmp": [".bmp"],
  };

  const extensionesPermitidas = Object.values(tiposPermitidos).flat();

  // Función para validar archivo
  const validarArchivo = (file: File): string | null => {
    if (!Object.keys(tiposPermitidos).includes(file.type)) {
      return `Tipo no permitido. Solo: ${extensionesPermitidas.join(", ")}`;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `Archivo muy grande. Máximo ${maxSizeMB}MB.`;
    }

    return null;
  };

  // Función para crear preview
  const crearPreview = (file: File): Promise<ArchivoAdjunto> => {
    return new Promise((resolve) => {
      const archivoData: ArchivoAdjunto = {
        file,
        id: `${Date.now()}-${Math.random()}`,
      };

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          archivoData.preview = e.target?.result as string;
          resolve(archivoData);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (e) => {
          archivoData.pdfDataUrl = e.target?.result as string;
          resolve(archivoData);
        };
        reader.readAsDataURL(file);
      } else {
        resolve(archivoData);
      }
    });
  };

  // Función para procesar archivo
  const procesarArchivo = async (file: File) => {
    setError("");

    const errorValidacion = validarArchivo(file);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const archivoData = await crearPreview(file);
    setArchivo(archivoData);

    if (onFileChange) {
      onFileChange(file);
    }
  };

  // Handlers para drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!archivo) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (archivo) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      procesarArchivo(files[0]);
    }
  };

  // Handler para input de archivo
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && !archivo) {
      procesarArchivo(files[0]);
    }
  };

  // Función para eliminar archivo
  const eliminarArchivo = () => {
    setArchivo(null);
    setShowPreview(false);

    if (onFileChange) {
      onFileChange(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Función para formatear tamaño de archivo
  const formatearTamaño = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  // Si ya hay archivo, mostrar vista compacta
  if (archivo) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <div className="flex items-center gap-3">
              {/* Thumbnail pequeño */}
              <div
                className="w-12 h-12 bg-default-100 rounded-lg border flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setShowPreview(true)}
              >
                {archivo.preview ? (
                  <img
                    src={archivo.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : archivo.file.type === "application/pdf" ? (
                  <FileText size={20} className="text-danger" />
                ) : (
                  <Image size={20} className="text-default-400" />
                )}
              </div>

              {/* Info del archivo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-default-700 truncate">
                  {archivo.file.name}
                </p>
                <p className="text-xs text-default-500">
                  {formatearTamaño(archivo.file.size)}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  color="primary"
                  onPress={() => setShowPreview(true)}
                  className="w-8 h-8 min-w-8"
                >
                  <Eye size={14} />
                </Button>

                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  color="danger"
                  onPress={eliminarArchivo}
                  className="w-8 h-8 min-w-8"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Modal de preview simplificado */}
        {showPreview && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <div className="relative max-w-4xl max-h-full w-full h-full flex flex-col">
              {/* Header compacto */}
              <div className="flex justify-between items-center mb-3 bg-black/50 p-2 rounded-lg">
                <div className="text-white text-sm">
                  <span className="font-medium">{archivo.file.name}</span>
                  <span className="text-gray-300 ml-2">
                    ({formatearTamaño(archivo.file.size)})
                  </span>
                </div>

                <Button
                  isIconOnly
                  color="danger"
                  variant="solid"
                  size="sm"
                  onPress={() => setShowPreview(false)}
                  className="w-8 h-8 min-w-8"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Contenido del preview */}
              <div className="flex-1 flex items-center justify-center overflow-auto">
                {archivo.preview ? (
                  <img
                    src={archivo.preview}
                    alt={archivo.file.name}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : archivo.pdfDataUrl ? (
                  <iframe
                    src={archivo.pdfDataUrl}
                    className="w-full h-full rounded-lg"
                    title={archivo.file.name}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-center text-white">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Vista previa no disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dropzone compacto
  return (
    <div className={`w-full ${className}`}>
      <Card
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary-50"
            : "border-default-300 hover:border-primary hover:bg-default-50"
        }`}
      >
        <CardBody
          className="p-4 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center justify-center gap-3">
            <div
              className={`p-2 rounded-full transition-colors ${
                isDragOver ? "bg-primary-100" : "bg-default-100"
              }`}
            >
              <Upload
                size={20}
                className={isDragOver ? "text-primary" : "text-default-500"}
              />
            </div>

            <div className="text-left">
              <p className="text-sm font-medium text-default-700">
                Adjuntar Planilla
              </p>
              <p className="text-xs text-default-500">
                PDF, JPG, PNG • Máx {maxSizeMB}MB
              </p>
            </div>

            <Button
              color="primary"
              variant="flat"
              size="sm"
              onPress={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Seleccionar
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={Object.keys(tiposPermitidos).join(",")}
            onChange={handleFileInput}
            className="hidden"
          />
        </CardBody>
      </Card>

      {/* Mensaje de error compacto */}
      {error && (
        <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-danger flex-shrink-0" />
          <span className="text-xs text-danger">{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadPlanilla;
