import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import Question from './Question';

export interface UserQuizQuestionAttributes {
  id: number;
  user_quiz_id: number;
  question_id: number;
  question_order: number;
  created_at?: Date;
  // Associations
  question?: Question;
}

interface UserQuizQuestionCreationAttributes extends Optional<UserQuizQuestionAttributes, 'id' | 'created_at'> {}

class UserQuizQuestion extends Model<UserQuizQuestionAttributes, UserQuizQuestionCreationAttributes> implements UserQuizQuestionAttributes {
  public id!: number;
  public user_quiz_id!: number;
  public question_id!: number;
  public question_order!: number;
  public readonly created_at!: Date;
  // Associations
  public question?: Question;
}

UserQuizQuestion.init(
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
      onDelete: 'CASCADE',
    },
    question_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserQuizQuestion',
    tableName: 'user_quiz_questions',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_quiz_id', 'question_id'],
      },
    ],
  }
);

export default UserQuizQuestion;
