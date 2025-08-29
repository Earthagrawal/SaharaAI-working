/// <reference types="jest" />
/// <reference types="jest" />
import { render, screen, fireEvent } from '@testing-library/react';
import { Composer } from './components/Composer';

describe('Composer', () => {
  it('renders and sends message on button click', () => {
    const onSend = jest.fn();
    render(<Composer value="hi" onChange={() => {}} onSend={onSend} />);
    fireEvent.click(screen.getByText('Send'));
    expect(onSend).toHaveBeenCalled();
  });
});
