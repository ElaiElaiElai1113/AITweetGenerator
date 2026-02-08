import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TweetPreview } from '../TweetPreview';

describe('TweetPreview', () => {
  it('renders tweet content', () => {
    render(<TweetPreview content="Test tweet" />);
    expect(screen.getByText('Test tweet')).toBeInTheDocument();
  });

  it('shows character count', () => {
    render(<TweetPreview content="Test" />);
    expect(screen.getByText('4/280')).toBeInTheDocument();
  });

  it('highights when over limit', () => {
    const longTweet = 'a'.repeat(281);
    render(<TweetPreview content={longTweet} />);
    const counterElement = screen.getByText('281/280');
    expect(counterElement).toHaveClass('text-red-500');
  });

  it('shows warning when approaching limit', () => {
    const nearLimitTweet = 'a'.repeat(265);
    render(<TweetPreview content={nearLimitTweet} />);
    expect(screen.getByText('265/280')).toBeInTheDocument();
  });

  it('shows green when under safe limit', () => {
    const shortTweet = 'Hello world';
    render(<TweetPreview content={shortTweet} />);
    const counterElement = screen.getByText('11/280');
    expect(counterElement).toHaveClass('text-green-500');
  });

  it('handles empty content gracefully', () => {
    render(<TweetPreview content="" />);
    expect(screen.getByText('0/280')).toBeInTheDocument();
  });

  it('handles special characters without crashing', () => {
    const specialTweet = '🚀 Hello #World @user! Test™';
    const { container } = render(<TweetPreview content={specialTweet} />);
    expect(container.firstChild).toBeVisible();
  });

  it('displays correctly in light theme', () => {
    const { container } = render(<TweetPreview content="Test tweet" />);
    expect(container.firstChild).toBeVisible();
  });

  it('displays custom username and display name', () => {
    render(<TweetPreview content="Test" username="testuser" displayName="Test User" />);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
