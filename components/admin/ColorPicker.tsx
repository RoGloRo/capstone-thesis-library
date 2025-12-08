"use client";

import { useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  "#012B48", "#1E40AF", "#DC2626", "#059669", "#D97706",
  "#7C3AED", "#DB2777", "#0891B2", "#65A30D", "#DC2626",
  "#374151", "#1F2937", "#111827", "#581C87", "#991B1B"
];

const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const handlePresetClick = (presetColor: string) => {
    handleColorChange(presetColor);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Color Preview */}
      <div
        className="w-10 h-10 rounded-md border-2 border-gray-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      
      {/* Color Input */}
      <Input
        value={color}
        onChange={(e) => handleColorChange(e.target.value)}
        placeholder="#000000"
        className="w-24 font-mono text-sm"
      />
      
      {/* Color Picker Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" type="button">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="start">
          <div className="space-y-4">
            {/* Preset Colors */}
            <div>
              <label className="text-sm font-medium mb-2 block">Preset Colors</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => handlePresetClick(presetColor)}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>
            
            {/* Custom Color Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">Custom Color</label>
              <HexColorPicker 
                color={tempColor} 
                onChange={handleColorChange}
                style={{ width: '100%', height: '150px' }}
              />
            </div>
            
            {/* Hex Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Hex Code</label>
              <HexColorInput
                color={tempColor}
                onChange={handleColorChange}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorPicker;
