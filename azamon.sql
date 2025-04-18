PGDMP  !    9                }           Azamon    17.2    17.2 $    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16399    Azamon    DATABASE     |   CREATE DATABASE "Azamon" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE "Azamon";
                     postgres    false            �            1259    16491 
   cart_items    TABLE     V  CREATE TABLE public.cart_items (
    id integer NOT NULL,
    "cartId" integer NOT NULL,
    "productId" character varying NOT NULL,
    name character varying NOT NULL,
    price numeric(10,2) NOT NULL,
    avatar character varying,
    quantity integer DEFAULT 1 NOT NULL,
    completed character varying,
    received character varying
);
    DROP TABLE public.cart_items;
       public         heap r       postgres    false            �            1259    16490    cart_items_id_seq    SEQUENCE     �   CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.cart_items_id_seq;
       public               postgres    false    224            �           0    0    cart_items_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;
          public               postgres    false    223            �            1259    16479    carts    TABLE     v  CREATE TABLE public.carts (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    status character varying NOT NULL,
    "deliveryType" character varying NOT NULL,
    promo character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    phone character varying NOT NULL,
    address character varying NOT NULL,
    city character varying NOT NULL,
    state character varying NOT NULL,
    "postalCode" character varying NOT NULL,
    country character varying NOT NULL
);
    DROP TABLE public.carts;
       public         heap r       postgres    false            �            1259    16478    carts_id_seq    SEQUENCE     �   CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.carts_id_seq;
       public               postgres    false    222            �           0    0    carts_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;
          public               postgres    false    221            �            1259    16467 
   categories    TABLE     �   CREATE TABLE public.categories (
    id integer NOT NULL,
    avatar character varying,
    name character varying NOT NULL,
    "productCount" integer
);
    DROP TABLE public.categories;
       public         heap r       postgres    false            �            1259    16466    categories_id_seq    SEQUENCE     �   CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.categories_id_seq;
       public               postgres    false    220            �           0    0    categories_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
          public               postgres    false    219            �            1259    16436    users    TABLE     �  CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying NOT NULL,
    email character varying NOT NULL,
    role character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "refreshToken" character varying,
    avatar character varying,
    products text,
    password text NOT NULL,
    cart text
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    16435    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    218            �           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    217            8           2604    16494    cart_items id    DEFAULT     n   ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);
 <   ALTER TABLE public.cart_items ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223    224            4           2604    16482    carts id    DEFAULT     d   ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);
 7   ALTER TABLE public.carts ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            3           2604    16470    categories id    DEFAULT     n   ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
 <   ALTER TABLE public.categories ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    220    219    220            0           2604    16439    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    217    218    218            �          0    16491 
   cart_items 
   TABLE DATA           s   COPY public.cart_items (id, "cartId", "productId", name, price, avatar, quantity, completed, received) FROM stdin;
    public               postgres    false    224   �,       �          0    16479    carts 
   TABLE DATA           �   COPY public.carts (id, "userId", total, status, "deliveryType", promo, "createdAt", "updatedAt", phone, address, city, state, "postalCode", country) FROM stdin;
    public               postgres    false    222   3.       �          0    16467 
   categories 
   TABLE DATA           F   COPY public.categories (id, avatar, name, "productCount") FROM stdin;
    public               postgres    false    220   �/       �          0    16436    users 
   TABLE DATA           �   COPY public.users (id, login, email, role, "createdAt", "updatedAt", "refreshToken", avatar, products, password, cart) FROM stdin;
    public               postgres    false    218   �/       �           0    0    cart_items_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.cart_items_id_seq', 185, true);
          public               postgres    false    223            �           0    0    carts_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.carts_id_seq', 157, true);
          public               postgres    false    221            �           0    0    categories_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.categories_id_seq', 52, true);
          public               postgres    false    219            �           0    0    users_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.users_id_seq', 290, true);
          public               postgres    false    217            A           2606    16474 )   categories PK_24dbc6126a28ff948da33e97d3b 
   CONSTRAINT     i   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);
 U   ALTER TABLE ONLY public.categories DROP CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b";
       public                 postgres    false    220            G           2606    16499 )   cart_items PK_6fccf5ec03c172d27a28a82928b 
   CONSTRAINT     i   ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY (id);
 U   ALTER TABLE ONLY public.cart_items DROP CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b";
       public                 postgres    false    224            ;           2606    16445 $   users PK_a3ffb1c0c8416b9fc6f907b7433 
   CONSTRAINT     d   ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.users DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433";
       public                 postgres    false    218            E           2606    16489 $   carts PK_b5f695a59f5ebb50af3c8160816 
   CONSTRAINT     d   ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.carts DROP CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816";
       public                 postgres    false    222            =           2606    16457 $   users UQ_2d443082eccd5198f95f2a36e2c 
   CONSTRAINT     b   ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE (login);
 P   ALTER TABLE ONLY public.users DROP CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c";
       public                 postgres    false    218            C           2606    16476 )   categories UQ_8b0be371d28245da6e4f4b61878 
   CONSTRAINT     f   ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE (name);
 U   ALTER TABLE ONLY public.categories DROP CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878";
       public                 postgres    false    220            ?           2606    16447 $   users UQ_97672ac88f789774dd47f7c8be3 
   CONSTRAINT     b   ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);
 P   ALTER TABLE ONLY public.users DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3";
       public                 postgres    false    218            H           2606    16500 )   cart_items FK_edd714311619a5ad09525045838    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "FK_edd714311619a5ad09525045838" FOREIGN KEY ("cartId") REFERENCES public.carts(id);
 U   ALTER TABLE ONLY public.cart_items DROP CONSTRAINT "FK_edd714311619a5ad09525045838";
       public               postgres    false    224    4677    222            �   �  x�͖=r�0Fk�0�տr�� �X�6�b���}`�'��1�
ڏ�zߎ�3Кy���TڹhE�"e���=*��\��sƀ�<�K��N)���%��K��w\���������\���9�c?<��%���s�|Tؽ�q���^cݾ�C��}�B�'�J�����t��P7�{�̇v����u�������D�8�M���bLZ��L-�����G}�Q8R�;c���Ig8�9p<����!�M:�#�e밖(�ӑ�a\��S֢�S�pƔs���y�'�m��(�<wF��^���6�B
����]&вxJ ʒKc1n+�ZBx�:�$�m�

)���Re�]n�PqPP��VŔ��%'ʢO��Ẹu#lq*~>��"�ǧ�P�ʗj��};*O      �   >  x���=O�0����QO�/�왑��		Y4BTM�Ŀ�ي�6�,����3Jr�q����~8�;7��mW�s�I����7��5k3QM$�Q�-	��ሔȢ�����P���6C?��`q�����8�U���C�������>�BdQ�m��#��q=�c��4��U�"h�׳蔵������ӟ@^�J��I�� V�+����$.w��b�&R�,`��z��\��>Ϳ�Γ֨�&�U!����6�Ė�yCS��-���Ǯ��D!�ǅ�qU� �G3n����u�]��ؖE��M��,��W
���G���.i�      �   k   x��K�  �5�(����Jx��	���;c��Z+�����|a��:��`����B:\p��7߬�˪x�B�5�޻e�(��a�Ǜ�T{�b�F�RR�?��%      �   �  x���;s�@�Z�

��j�ڻ�����`����Y�J $!Y@��f����3�8�9�ʸ���\'�Z�i,������>�>�>ňq��0�'��ܧq%�d���zx�����I�\��&h��nX<�J�G����������ح��Nkg�4e��n��dEk���:d�ܵ'����Mr��ܶ�
m���Q!<%\}Ѝ�j7V��O	tQz�*��������b( %-!B1i���<�]>���1���L�(ź��=����΋���a�ꕗ��Q��_��\�G=�bt�Q�����fz?�J��|ʑ'�~�i�����	RL0,�;��8��>���.���l2U��Xy�7n6�v�e�J�Qz;��_PƄ��Zآ���rW���Ę�]y��PǚX+����Z Pũ$T?cm���JI�=�Ia�R����K����}L�V�c�mSm�ه|n2����������㲴����z��'>��     