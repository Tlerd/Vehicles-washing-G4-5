import React from 'react';
import styles from './Stepper.module.css';

interface StepperProps {
  steps: { label: string; icon: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <React.Fragment key={stepNum}>
            <div
              className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              onClick={() => isCompleted && onStepClick?.(stepNum)}
              role={isCompleted ? 'button' : undefined}
              tabIndex={isCompleted ? 0 : undefined}
            >
              <div className={styles.stepCircle}>
                {isCompleted ? (
                  <span className={styles.checkmark}>✓</span>
                ) : (
                  <span className={styles.stepIcon}>{step.icon}</span>
                )}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`${styles.connector} ${isCompleted ? styles.connectorCompleted : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
