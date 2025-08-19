import React, { useState, useRef } from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Eye,
  Download,
  AlertCircle,
  RotateCw,
  ZoomIn,
  ZoomOut
} from "lucide-react";

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
  className = ""
}) => {
  const [archivo, setArchivo] = useState<ArchivoAdjunto | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tipos de archivo permitidos
  const tiposPermitidos = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp']
  };

  const extensionesPermitidas = Object.values(tiposPermitidos).flat();

  // Función para validar archivo
  const validarArchivo = (file: File): string | null => {
    // Verificar tipo de archivo
    if (!Object.keys(tiposPermitidos).includes(file.type)) {
      return `Tipo de archivo no permitido. Solo se aceptan: ${extensionesPermitidas.join(', ')}`;
    }

    // Verificar tamaño
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB permitido.`;
    }

    return null;
  };

  // Función para crear preview
  const crearPreview = (file: File): Promise<ArchivoAdjunto> => {
    return new Promise((resolve) => {
      const archivoData: ArchivoAdjunto = {
        file,
        id: `${Date.now()}-${Math.random()}`
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          archivoData.preview = e.target?.result as string;
          resolve(archivoData);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
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
    
    if (archivo) return; // No permitir si ya hay archivo
    
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
    setPdfZoom(1);
    
    if (onFileChange) {
      onFileChange(null);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para cambiar archivo
  const cambiarArchivo = () => {
    eliminarArchivo();
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  // Función para formatear tamaño de archivo
  const formatearTamaño = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Si ya hay archivo, mostrar preview
  if (archivo) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                {archivo.file.type === 'application/pdf' ? (
                  <FileText size={20} className="text-danger" />
                ) : (
                  <ImageIcon size={20} className="text-primary" />
                )}
                <div>
                  <h4 className="text-sm font-semibold text-default-700">
                    Planilla adjunta
                  </h4>
                  <p className="text-xs text-default-500">
                    {archivo.file.name} • {formatearTamaño(archivo.file.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  color="primary"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye size={14} />
                </Button>
                
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  color="default"
                  onClick={() => {
                    const url = URL.createObjectURL(archivo.file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = archivo.file.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={14} />
                </Button>

                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  color="warning"
                  onClick={cambiarArchivo}
                >
                  <RotateCw size={14} />
                </Button>
                
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  color="danger"
                  onClick={eliminarArchivo}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="pt-0">
            {/* Preview thumbnail */}
            <div className="w-full h-32 bg-default-100 rounded-lg border-2 border-dashed border-default-300 flex items-center justify-center overflow-hidden cursor-pointer"
                 onClick={() => setShowPreview(true)}>
              {archivo.preview ? (
                <img 
                  src={archivo.preview} 
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : archivo.file.type === 'application/pdf' ? (
                <div className="text-center">
                  <FileText size={48} className="text-danger mx-auto mb-2" />
                  <p className="text-sm text-default-600">Click para previsualizar PDF</p>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon size={48} className="text-default-400 mx-auto mb-2" />
                  <p className="text-sm text-default-500">Vista previa no disponible</p>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-3">
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Eye size={16} />}
                onClick={() => setShowPreview(true)}
              >
                Ver en pantalla completa
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Modal de preview */}
        {showPreview && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <div className="relative w-full h-full max-w-6xl max-h-full flex flex-col">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-4 bg-black/50 p-3 rounded-lg">
                <div className="text-white">
                  <h3 className="font-semibold">{archivo.file.name}</h3>
                  <p className="text-sm text-gray-300">{formatearTamaño(archivo.file.size)}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {archivo.file.type === 'application/pdf' && (
                    <>
                      <Button
                        isIconOnly
                        color="default"
                        variant="flat"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfZoom(Math.max(0.5, pdfZoom - 0.25));
                        }}
                      >
                        <ZoomOut size={16} />
                      </Button>
                      <span className="text-white text-sm px-2">{Math.round(pdfZoom * 100)}%</span>
                      <Button
                        isIconOnly
                        color="default"
                        variant="flat"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfZoom(Math.min(3, pdfZoom + 0.25));
                        }}
                      >
                        <ZoomIn size={16} />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    isIconOnly
                    color="danger"
                    variant="solid"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
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
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <iframe
                      src={archivo.pdfDataUrl}
                      className="w-full h-full rounded-lg"
                      style={{ 
                        transform: `scale(${pdfZoom})`,
                        transformOrigin: 'center center'
                      }}
                      title={archivo.file.name}
                    />
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                    <p>No se puede mostrar la vista previa de este archivo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si no hay archivo, mostrar dropzone
  return (
    <div className={`w-full ${className}`}>
      {/* Zona de upload */}
      <Card 
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary-50' 
            : 'border-default-300 hover:border-primary hover:bg-default-50'
        }`}
      >
        <CardBody
          className="p-6 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full transition-colors ${
              isDragOver ? 'bg-primary-100' : 'bg-default-100'
            }`}>
              <Upload size={32} className={isDragOver ? 'text-primary' : 'text-default-500'} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-default-700">
                Adjuntar Planilla
              </h3>
              <p className="text-sm text-default-500 mt-1">
                Arrastra y suelta tu planilla aquí, o haz clic para seleccionar
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Chip size="sm" variant="flat" color="danger">PDF</Chip>
              <Chip size="sm" variant="flat" color="primary">JPG</Chip>
              <Chip size="sm" variant="flat" color="primary">PNG</Chip>
              <Chip size="sm" variant="flat" color="primary">WEBP</Chip>
            </div>

            <p className="text-xs text-default-400">
              1 archivo máximo • Hasta {maxSizeMB}MB
            </p>

            <Button 
              color="primary" 
              variant="flat"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Seleccionar Archivo
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={Object.keys(tiposPermitidos).join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </CardBody>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-danger" />
          <span className="text-sm text-danger">{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadPlanilla;