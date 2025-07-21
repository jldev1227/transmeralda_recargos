import React, { useMemo, useCallback } from 'react';
import { Button } from '@heroui/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';

interface DateNavigationProps {
  currentMonth: number;
  currentYear: number;
  onDateChange: (month: number, year: number) => void;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  currentMonth,
  currentYear,
  onDateChange
}) => {
  const MONTH_NAMES = useMemo(
    () => [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ],
    [],
  );

  // Generar años (5 años hacia atrás y 5 hacia adelante)
  const yearOptions = useMemo(() => {
    const currentYearValue = new Date().getFullYear();
    const years = [];
    for (let i = currentYearValue - 5; i <= currentYearValue + 5; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const changeMonth = useCallback(
    (direction: string) => {
      let newMonth = currentMonth;
      let newYear = currentYear;

      if (direction === "prev") {
        if (currentMonth === 1) {
          newMonth = 12;
          newYear = currentYear - 1;
        } else {
          newMonth = currentMonth - 1;
        }
      } else {
        if (currentMonth === 12) {
          newMonth = 1;
          newYear = currentYear + 1;
        } else {
          newMonth = currentMonth + 1;
        }
      }

      onDateChange(newMonth, newYear);
    },
    [currentMonth, currentYear, onDateChange],
  );

  const changeYear = useCallback(
    (direction: string) => {
      const newYear = direction === "prev" ? currentYear - 1 : currentYear + 1;
      onDateChange(currentMonth, newYear);
    },
    [currentMonth, currentYear, onDateChange],
  );

  const handleMonthSelect = useCallback((month: number) => {
    onDateChange(month, currentYear);
  }, [currentYear, onDateChange]);

  const handleYearSelect = useCallback((year: number) => {
    onDateChange(currentMonth, year);
  }, [currentMonth, onDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    onDateChange(today.getMonth() + 1, today.getFullYear());
  }, [onDateChange]);

  return (
    <div className="flex items-center gap-4">
      {/* Navegación de año */}
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="solid"
          color="default"
          size="sm"
          onPress={() => changeYear("prev")}
          title="Año anterior"
          className="bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-md"
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="solid" 
              color="default"
              className="min-w-[80px] font-semibold bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-md"
              endContent={<ChevronDown size={16} />}
            >
              {currentYear}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Seleccionar año"
            selectedKeys={[currentYear.toString()]}
            selectionMode="single"
            onAction={(key) => handleYearSelect(Number(key))}
          >
            {yearOptions.map((year) => (
              <DropdownItem key={year.toString()}>
                {year}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Button
          isIconOnly
          variant="solid"
          color="default"
          size="sm"
          onPress={() => changeYear("next")}
          title="Año siguiente"
          className="bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-md"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Navegación de mes */}
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="solid"
          color="default"
          onPress={() => changeMonth("prev")}
          title="Mes anterior"
          className="bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-md"
        >
          <ChevronLeft size={20} />
        </Button>

        <div className="text-center min-w-[300px]">
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="solid" 
                color="default"
                className="text-2xl font-bold min-w-[250px] h-auto py-3 bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-lg"
                startContent={<Calendar size={24} />}
                endContent={<ChevronDown size={20} />}
              >
                {MONTH_NAMES[currentMonth - 1]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Seleccionar mes"
              selectedKeys={[currentMonth.toString()]}
              selectionMode="single"
              onAction={(key) => handleMonthSelect(Number(key))}
            >
              {MONTH_NAMES.map((month, index) => (
                <DropdownItem key={(index + 1).toString()}>
                  {month}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        <Button
          isIconOnly
          variant="solid"
          color="default"
          onPress={() => changeMonth("next")}
          title="Mes siguiente"
          className="bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-md"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Botón para volver a hoy */}
      <Button
        variant="solid"
        color="default"
        size="sm"
        onPress={goToToday}
        className="font-medium bg-white text-emerald-600 hover:bg-gray-100 border-2 border-white shadow-md"
      >
        Hoy
      </Button>
    </div>
  );
};

export default DateNavigation;