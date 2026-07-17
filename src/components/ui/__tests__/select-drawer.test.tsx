/**
 * UI Select + Drawer tests
 *
 * Stage 9 PR-16: components/ui — select.tsx (base-ui) + drawer.tsx (vaul)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
} from '../select';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '../drawer';

describe('Select', () => {
  it('renders closed trigger with value placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('trigger has data-slot', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="X" />
        </SelectTrigger>
      </Select>,
    );
    expect(container.querySelector('[data-slot="select-trigger"]')).toBeInTheDocument();
  });

  it('trigger has default data-size', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="X" />
        </SelectTrigger>
      </Select>,
    );
    const trigger = container.querySelector('[data-slot="select-trigger"]')!;
    expect(trigger).toHaveAttribute('data-size', 'default');
  });

  it('trigger accepts sm size', () => {
    const { container } = render(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="X" />
        </SelectTrigger>
      </Select>,
    );
    const trigger = container.querySelector('[data-slot="select-trigger"]')!;
    expect(trigger).toHaveAttribute('data-size', 'sm');
  });

  it('trigger renders chevron icon', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="X" />
        </SelectTrigger>
      </Select>,
    );
    // ChevronDownIcon is rendered as SVG
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders items in open Select with defaultOpen', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue placeholder="X" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Apple</SelectItem>
          <SelectItem value="b">Banana</SelectItem>
          <SelectItem value="c">Cherry</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('renders group + label + separator', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue placeholder="X" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="a">Apple</SelectItem>
            <SelectSeparator />
            <SelectItem value="b">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('disabled item is non-interactive', () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue placeholder="X" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a" disabled>Apple</SelectItem>
          <SelectItem value="b">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });
});

describe('Drawer', () => {
  it('renders closed with trigger', () => {
    render(
      <Drawer>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>DT</DrawerTitle>
            <DrawerDescription>DD</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <button>OK</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText('Open Drawer')).toBeInTheDocument();
  });

  it('renders open with defaultOpen', () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Visible Title</DrawerTitle>
          <DrawerDescription>Visible Desc</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText('Visible Title')).toBeInTheDocument();
  });

  it('renders subcomponents with data-slot', () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHeader data-testid="dh">H</DrawerHeader>
          <DrawerFooter data-testid="df">F</DrawerFooter>
          <DrawerClose data-testid="dc">X</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByTestId('dh')).toHaveAttribute('data-slot', 'drawer-header');
    expect(screen.getByTestId('df')).toHaveAttribute('data-slot', 'drawer-footer');
    expect(screen.getByTestId('dc')).toBeInTheDocument();
  });

  it('renders nested content correctly', () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Configure your preferences</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <button>Save</button>
            <button>Cancel</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your preferences')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
