import { Input, type InputProps } from './Input';

export type NumberInputProps = InputProps & {
  // Can extend with specific numeric props if needed in the future
};

export function NumberInput({ className = '', style, ...props }: NumberInputProps) {
  return (
    <Input 
      type="number"
      className={className}
      style={{ 
        textAlign: 'right', 
        fontVariantNumeric: 'tabular-nums',
        ...style 
      }}
      step="any"
      {...props}
    />
  );
}
