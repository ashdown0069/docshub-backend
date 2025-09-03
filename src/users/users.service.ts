import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { User } from 'src/common/database/schemas/users.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { AuthService } from './auth/auth.service';
import { hashPassword } from 'src/common/utils/bcrypt';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  test() {
    const user = this.userModel.create({
      email: 'test@test.com',
      nickname: 'test',
      password: 'test',
      plan: 'free',
      dbRefreshToken: null,
    });
    return user;
  }

  async create(createUserData: CreateUserDto, session?: ClientSession) {
    const { email, nickname, password } = createUserData;
    const hashedPassword = await hashPassword(password);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      nickname,
    });

    return await user.save({ session });
  }
  async isDuplicateEmail(email: string) {
    if (!email) {
      throw new BadRequestException('email is required');
    }
    const foundEmail = await this.userModel.findOne({ email, isDeleted: null });
    if (foundEmail) {
      throw new BadRequestException({
        message: 'email already exists',
        field: 'email',
        key: 'duplicate',
      });
    }
    return true;
  }

  async isDuplicateNickname(nickname: string) {
    if (!nickname) {
      throw new BadRequestException('email is required');
    }
    const foundEmail = await this.userModel.findOne({
      nickname,
      isDeleted: null,
    });
    if (foundEmail) {
      throw new BadRequestException({
        message: 'nickname already exists',
        field: 'nickname',
        key: 'duplicate',
      });
    }
    return true;
  }

  async findOneByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('id is required');
    }
    const foundUser = await this.userModel.findOne({ email, isDeleted: null });
    if (!foundUser) {
      throw new NotFoundException('user not found');
    }
    return foundUser;
  }

  async findOneById(id: string) {
    if (!id) {
      throw new BadRequestException('id is required');
    }
    const foundUser = await this.userModel.findOne({
      _id: id,
      isDeleted: null,
    });
    if (!foundUser) {
      throw new NotFoundException('user not found');
    }
    return foundUser;
  }

  async find(email: string) {
    if (!email) {
      throw new BadRequestException('email is required');
    }
    return await this.userModel.find({ email, isDeleted: null });
  }

  async update(id: string, attrs: Partial<User>, session?: ClientSession) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: null });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    user.set(attrs);
    const updatedUser = await user.save({ session });
    return updatedUser;
  }

  async delete(id: string, session?: ClientSession) {
    const foundUser = await this.findOneById(id);
    if (!foundUser) {
      throw new NotFoundException('user not found');
    }
    foundUser.isDeleted = new Date();
    await foundUser.save({ session });
    return true;
  }
}
