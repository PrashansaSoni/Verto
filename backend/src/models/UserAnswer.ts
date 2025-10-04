import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface UserAnswerAttributes {
  id: number;
  user_quiz_id: number;
  question_id: number;
  selected_option_ids: string; // JSON array of selected option IDs
  is_correct?: boolean;
  marks_obtained: number;
  answered_at?: Date;
}

interface UserAnswerCreationAttributes extends Optional<UserAnswerAttributes, 'id' | 'answered_at'> {}

class UserAnswer extends Model<UserAnswerAttributes, UserAnswerCreationAttributes> implements UserAnswerAttributes {
  public id!: number;
  public user_quiz_id!: number;
  public question_id!: number;
  public selected_option_ids!: string;
  public is_correct?: boolean;
  public marks_obtained!: number;
  public readonly answered_at!: Date;
}

UserAnswer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_quizzes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
    },
    selected_option_ids: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON array of selected option IDs',
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    marks_obtained: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 0,
    },
    answered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserAnswer',
    tableName: 'user_answers',
    createdAt: 'answered_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_quiz_id', 'question_id'],
      },
    ],
  }
);

export default UserAnswer;
