import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface QuizQuestionAttributes {
  id: number;
  quiz_id: number;
  question_id: number;
  question_order?: number;
  created_at?: Date;
}

interface QuizQuestionCreationAttributes extends Optional<QuizQuestionAttributes, 'id' | 'created_at'> {}

class QuizQuestion extends Model<QuizQuestionAttributes, QuizQuestionCreationAttributes> implements QuizQuestionAttributes {
  public id!: number;
  public quiz_id!: number;
  public question_id!: number;
  public question_order?: number;
  public readonly created_at!: Date;
}

QuizQuestion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quizzes',
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
      onDelete: 'CASCADE',
    },
    question_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'QuizQuestion',
    tableName: 'quiz_questions',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['quiz_id', 'question_id'],
      },
    ],
  }
);

export default QuizQuestion;
